-- ============================================================================
-- TrendArena: Full Database Schema (Scalable, Future-Proof)
-- ============================================================================
-- Design principles:
--   1. UUID primary keys everywhere (merge-safe, no sequence conflicts)
--   2. JSONB for extensible metadata (no ALTER TABLE for new fields)
--   3. Denormalized counters on profiles (fast reads, trigger-maintained)
--   4. Seasons system from day 1 (enables seasonal leaderboards later)
--   5. Configurable virality thresholds (no hardcoded magic numbers)
--   6. Soft-delete / ban patterns (never lose data)
--   7. Comprehensive indexes for every query pattern
--   8. RLS policies for multi-tenant security
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for text search on usernames

-- ============================================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  twitter_id    TEXT UNIQUE NOT NULL,
  username      TEXT NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  bio           TEXT,

  -- Denormalized scores (trigger-maintained for fast reads)
  points              INTEGER   NOT NULL DEFAULT 0,
  level               INTEGER   NOT NULL DEFAULT 1,
  streak_current      INTEGER   NOT NULL DEFAULT 0,
  streak_best         INTEGER   NOT NULL DEFAULT 0,
  predictions_count   INTEGER   NOT NULL DEFAULT 0,
  correct_predictions INTEGER   NOT NULL DEFAULT 0,

  -- Referral system
  referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  referred_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Moderation
  role          TEXT    NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'moderator', 'admin')),
  is_banned     BOOLEAN NOT NULL DEFAULT false,
  banned_at     TIMESTAMPTZ,
  banned_reason TEXT,

  -- Extensible settings (notification prefs, UI theme, etc.)
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_twitter_id   ON public.profiles(twitter_id);
CREATE INDEX idx_profiles_username     ON public.profiles USING gin(username gin_trgm_ops);
CREATE INDEX idx_profiles_points       ON public.profiles(points DESC);
CREATE INDEX idx_profiles_referral     ON public.profiles(referral_code);
CREATE INDEX idx_profiles_role         ON public.profiles(role) WHERE role != 'user';

-- ============================================================================
-- 2. TWEETS (cached Twitter data)
-- ============================================================================
CREATE TABLE public.tweets (
  id                TEXT PRIMARY KEY,  -- Twitter tweet ID (string)
  author_id         TEXT,
  author_username   TEXT,
  text              TEXT,

  -- Separate initial vs latest metrics for delta calculation
  metrics_initial   JSONB NOT NULL DEFAULT '{}'::jsonb,
  metrics_latest    JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Rich metadata (media, language, etc. — extensible without ALTER)
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,

  tweet_created_at  TIMESTAMPTZ,
  first_fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  fetch_count       INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_tweets_last_fetched  ON public.tweets(last_fetched_at);
CREATE INDEX idx_tweets_author        ON public.tweets(author_id);

-- ============================================================================
-- 3. VIRALITY THRESHOLDS (configurable, no hardcoded values)
-- ============================================================================
CREATE TABLE public.virality_thresholds (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  description         TEXT,

  -- What metric(s) to evaluate
  metric_type         TEXT NOT NULL DEFAULT 'likes'
                      CHECK (metric_type IN ('likes', 'retweets', 'replies', 'quotes', 'combined', 'growth_rate')),
  threshold_value     INTEGER NOT NULL,
  time_window_minutes INTEGER NOT NULL DEFAULT 60,

  -- Scoring multiplier (different thresholds can award different points)
  points_multiplier   NUMERIC(4,2) NOT NULL DEFAULT 1.0,

  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active  BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default threshold
INSERT INTO public.virality_thresholds (name, description, metric_type, threshold_value, time_window_minutes, is_default, is_active)
VALUES ('Standard Viral', 'Tweet gains 10K+ likes in 1 hour', 'likes', 10000, 60, true, true);

-- ============================================================================
-- 4. SEASONS (enables seasonal leaderboards from day 1)
-- ============================================================================
CREATE TABLE public.seasons (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT false,

  -- Extensible config: custom thresholds, point rules, etc.
  config     JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_season_dates CHECK (ends_at > starts_at)
);

CREATE INDEX idx_seasons_active ON public.seasons(is_active) WHERE is_active = true;

-- ============================================================================
-- 5. PREDICTIONS (core game entity)
-- ============================================================================
CREATE TYPE prediction_status AS ENUM ('pending', 'resolved', 'expired', 'cancelled');
CREATE TYPE confidence_level  AS ENUM ('low', 'normal', 'high');

CREATE TABLE public.predictions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tweet_id              TEXT NOT NULL REFERENCES public.tweets(id) ON DELETE CASCADE,
  season_id             UUID REFERENCES public.seasons(id) ON DELETE SET NULL,

  -- The actual prediction
  predicted_viral       BOOLEAN NOT NULL,
  confidence            confidence_level NOT NULL DEFAULT 'normal',

  -- Resolution
  status                prediction_status NOT NULL DEFAULT 'pending',
  is_correct            BOOLEAN,               -- NULL until resolved
  points_awarded        INTEGER NOT NULL DEFAULT 0,

  -- Snapshots for audit trail (never lose the data that decision was based on)
  metrics_at_prediction JSONB NOT NULL DEFAULT '{}'::jsonb,
  metrics_at_resolution JSONB,
  threshold_used        JSONB,                 -- snapshot of threshold config used

  -- Scheduling
  resolve_after         TIMESTAMPTZ NOT NULL,  -- when to evaluate (created_at + window)

  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- uniqueness enforced via partial index below
  CONSTRAINT predictions_pkey_check CHECK (true)
);

CREATE INDEX idx_predictions_user       ON public.predictions(user_id, created_at DESC);
CREATE INDEX idx_predictions_tweet      ON public.predictions(tweet_id);
CREATE INDEX idx_predictions_pending    ON public.predictions(resolve_after)
  WHERE status = 'pending';
CREATE INDEX idx_predictions_season     ON public.predictions(season_id, user_id)
  WHERE season_id IS NOT NULL;
CREATE INDEX idx_predictions_status     ON public.predictions(status);
CREATE INDEX idx_predictions_user_stats ON public.predictions(user_id, is_correct)
  WHERE status = 'resolved';
-- Prevent duplicate pending predictions: same user + same post
CREATE UNIQUE INDEX idx_unique_pending_prediction
  ON public.predictions(user_id, tweet_id)
  WHERE status = 'pending';

-- ============================================================================
-- 6. BADGES (catalog + user awards)
-- ============================================================================
CREATE TABLE public.badges (
  id               TEXT PRIMARY KEY,  -- e.g. 'first-prediction', 'streak-10'
  name             TEXT NOT NULL,
  description      TEXT,
  icon_url         TEXT,

  category         TEXT NOT NULL DEFAULT 'general'
                   CHECK (category IN ('general', 'streak', 'accuracy', 'social', 'milestone', 'special')),
  rarity           TEXT NOT NULL DEFAULT 'common'
                   CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),

  -- What triggers this badge
  requirement_type TEXT NOT NULL
                   CHECK (requirement_type IN ('predictions_count', 'correct_count', 'points', 'streak', 'referrals', 'accuracy_pct', 'custom')),
  requirement_value INTEGER,          -- NULL for 'custom' type

  points_bonus     INTEGER NOT NULL DEFAULT 0,   -- bonus points when earned
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON public.user_badges(user_id, awarded_at DESC);

-- Seed starter badges
INSERT INTO public.badges (id, name, description, category, rarity, requirement_type, requirement_value, points_bonus, sort_order) VALUES
  ('first-prediction',   'Crystal Ball',        'Submit your first prediction',          'milestone', 'common',    'predictions_count', 1,    5,   1),
  ('ten-predictions',    'Fortune Teller',      'Submit 10 predictions',                 'milestone', 'common',    'predictions_count', 10,   10,  2),
  ('fifty-predictions',  'Oracle',              'Submit 50 predictions',                 'milestone', 'uncommon',  'predictions_count', 50,   25,  3),
  ('hundred-predictions','Prophecy Master',     'Submit 100 predictions',                'milestone', 'rare',      'predictions_count', 100,  50,  4),
  ('first-correct',      'Lucky Guess',         'Get your first correct prediction',     'accuracy',  'common',    'correct_count',     1,    10,  5),
  ('ten-correct',        'Trend Spotter',       'Get 10 correct predictions',            'accuracy',  'uncommon',  'correct_count',     10,   25,  6),
  ('fifty-correct',      'Viral Whisperer',     'Get 50 correct predictions',            'accuracy',  'rare',      'correct_count',     50,   100, 7),
  ('streak-3',           'Hot Streak',          '3 correct predictions in a row',        'streak',    'common',    'streak',            3,    15,  8),
  ('streak-5',           'On Fire',             '5 correct predictions in a row',        'streak',    'uncommon',  'streak',            5,    30,  9),
  ('streak-10',          'Unstoppable',         '10 correct predictions in a row',       'streak',    'rare',      'streak',            10,   75,  10),
  ('streak-25',          'Legendary Seer',      '25 correct predictions in a row',       'streak',    'legendary', 'streak',            25,   250, 11),
  ('points-100',         'Rising Star',         'Earn 100 points',                       'milestone', 'common',    'points',            100,  0,   12),
  ('points-1000',        'Trend Master',        'Earn 1,000 points',                     'milestone', 'uncommon',  'points',            1000, 0,   13),
  ('points-10000',       'Arena Champion',      'Earn 10,000 points',                    'milestone', 'epic',      'points',            10000,0,   14),
  ('first-referral',     'Recruiter',           'Invite your first friend',              'social',    'common',    'referrals',         1,    20,  15),
  ('five-referrals',     'Ambassador',          'Invite 5 friends',                      'social',    'rare',      'referrals',         5,    100, 16);

-- ============================================================================
-- 7. SEASON SCORES (per-season leaderboard)
-- ============================================================================
CREATE TABLE public.season_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id         UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points            INTEGER NOT NULL DEFAULT 0,
  predictions_count INTEGER NOT NULL DEFAULT 0,
  correct_count     INTEGER NOT NULL DEFAULT 0,
  rank              INTEGER,

  CONSTRAINT unique_season_user UNIQUE (season_id, user_id)
);

CREATE INDEX idx_season_scores_rank ON public.season_scores(season_id, points DESC);

-- ============================================================================
-- 8. REFERRALS (tracking)
-- ============================================================================
CREATE TABLE public.referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bonus_awarded BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_referred UNIQUE (referred_id)
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);

-- ============================================================================
-- 9. NOTIFICATIONS
-- ============================================================================
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  type       TEXT NOT NULL
             CHECK (type IN ('prediction_resolved', 'badge_awarded', 'rank_change', 'friend_joined', 'streak_broken', 'system')),
  title      TEXT NOT NULL,
  body       TEXT,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,  -- type-specific payload

  is_read    BOOLEAN NOT NULL DEFAULT false,
  read_at    TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user    ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread  ON public.notifications(user_id)
  WHERE is_read = false;

-- ============================================================================
-- 10. EVENTS (telemetry / audit log)
-- ============================================================================
CREATE TABLE public.events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT NOT NULL,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partition-friendly index (query by type + time range)
CREATE INDEX idx_events_type_time ON public.events(type, created_at DESC);
CREATE INDEX idx_events_user      ON public.events(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- ============================================================================
-- 11. RATE LIMITS (per-user, server-enforced)
-- ============================================================================
CREATE TABLE public.rate_limits (
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,  -- e.g. 'prediction', 'search'
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count       INTEGER NOT NULL DEFAULT 1,

  PRIMARY KEY (user_id, action)
);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, twitter_id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'provider_id', NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'preferred_username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update denormalized counters on predictions table changes
CREATE OR REPLACE FUNCTION public.handle_prediction_resolved()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when status changes to 'resolved'
  IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
    -- Update profile counters
    UPDATE public.profiles SET
      points              = points + NEW.points_awarded,
      predictions_count   = predictions_count + 1,
      correct_predictions = correct_predictions + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
      streak_current      = CASE
                              WHEN NEW.is_correct THEN streak_current + 1
                              ELSE 0
                            END,
      streak_best         = CASE
                              WHEN NEW.is_correct AND streak_current + 1 > streak_best
                              THEN streak_current + 1
                              ELSE streak_best
                            END,
      level               = GREATEST(1, (points + NEW.points_awarded) / 100 + 1)
    WHERE id = NEW.user_id;

    -- Update season scores if prediction belongs to a season
    IF NEW.season_id IS NOT NULL THEN
      INSERT INTO public.season_scores (season_id, user_id, points, predictions_count, correct_count)
      VALUES (NEW.season_id, NEW.user_id, NEW.points_awarded, 1, CASE WHEN NEW.is_correct THEN 1 ELSE 0 END)
      ON CONFLICT (season_id, user_id) DO UPDATE SET
        points            = season_scores.points + EXCLUDED.points,
        predictions_count = season_scores.predictions_count + 1,
        correct_count     = season_scores.correct_count + EXCLUDED.correct_count;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_prediction_resolved
  AFTER UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.handle_prediction_resolved();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Leaderboard view (all-time)
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.points,
  p.level,
  p.streak_current,
  p.streak_best,
  p.predictions_count,
  p.correct_predictions,
  CASE WHEN p.predictions_count > 0
    THEN ROUND(p.correct_predictions::numeric / p.predictions_count * 100, 1)
    ELSE 0
  END AS accuracy_pct,
  RANK() OVER (ORDER BY p.points DESC) AS rank
FROM public.profiles p
WHERE p.is_banned = false AND p.predictions_count > 0
ORDER BY p.points DESC;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virality_thresholds ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only own profile can update
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tweets: anyone can read (public cache)
CREATE POLICY "Tweets are viewable by everyone"
  ON public.tweets FOR SELECT USING (true);
CREATE POLICY "Service role inserts tweets"
  ON public.tweets FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role updates tweets"
  ON public.tweets FOR UPDATE USING (true);

-- Predictions: users see own, insert own
CREATE POLICY "Users can view own predictions"
  ON public.predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create predictions"
  ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badges: anyone can read catalog
CREATE POLICY "Badges catalog is public"
  ON public.badges FOR SELECT USING (true);

-- User badges: anyone can see (public achievement)
CREATE POLICY "User badges are public"
  ON public.user_badges FOR SELECT USING (true);

-- Notifications: only own
CREATE POLICY "Users see own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Events: insert only (no user reads, admin/service only)
CREATE POLICY "Service inserts events"
  ON public.events FOR INSERT WITH CHECK (true);

-- Seasons: public read
CREATE POLICY "Seasons are public"
  ON public.seasons FOR SELECT USING (true);

-- Season scores: public read
CREATE POLICY "Season scores are public"
  ON public.season_scores FOR SELECT USING (true);

-- Referrals: users see own
CREATE POLICY "Users see own referrals"
  ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Virality thresholds: public read
CREATE POLICY "Thresholds are public"
  ON public.virality_thresholds FOR SELECT USING (true);

-- Rate limits: service managed
CREATE POLICY "Service manages rate limits"
  ON public.rate_limits FOR ALL USING (true);

-- ============================================================================
-- REALTIME (enable for live features)
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================================
-- GRANTS (required after schema reset; service_role bypasses RLS)
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
