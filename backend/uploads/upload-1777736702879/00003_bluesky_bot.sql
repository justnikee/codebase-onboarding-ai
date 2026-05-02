-- ============================================================================
-- TrendArena: Bluesky Bot Support
-- Adds shadow profiles, Bluesky post cache, and platform-agnostic predictions.
-- ============================================================================

-- 1. Shadow profiles: Bluesky users who haven't created a TrendArena account yet.
--    When they sign up, their history is merged into profiles via claimed_by.
CREATE TABLE public.bot_users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bluesky_did    TEXT UNIQUE NOT NULL,
  bluesky_handle TEXT        NOT NULL,

  -- Denormalized scores (mirroring profiles table)
  points              INTEGER NOT NULL DEFAULT 0,
  level               INTEGER NOT NULL DEFAULT 1,
  predictions_count   INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,

  -- Account claim tracking
  is_claimed BOOLEAN   NOT NULL DEFAULT false,
  claimed_by UUID      REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bot_users_did     ON public.bot_users(bluesky_did);
CREATE INDEX idx_bot_users_handle  ON public.bot_users(bluesky_handle);
CREATE INDEX idx_bot_users_points  ON public.bot_users(points DESC) WHERE is_claimed = false;

-- Auto-update updated_at for bot_users
CREATE TRIGGER set_bot_users_updated_at
  BEFORE UPDATE ON public.bot_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 2. Bluesky post cache (mirrors the existing tweets table structure)
-- ============================================================================
CREATE TABLE public.bluesky_posts (
  uri               TEXT PRIMARY KEY,  -- at://did/app.bsky.feed.post/rkey
  cid               TEXT NOT NULL,
  author_did        TEXT NOT NULL,
  author_handle     TEXT NOT NULL,
  text              TEXT,

  metrics_initial   JSONB NOT NULL DEFAULT '{}'::jsonb,
  metrics_latest    JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,

  post_created_at   TIMESTAMPTZ,
  first_fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  fetch_count       INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_bsky_posts_author       ON public.bluesky_posts(author_did);
CREATE INDEX idx_bsky_posts_last_fetched ON public.bluesky_posts(last_fetched_at);

-- ============================================================================
-- 3. Extend predictions table to support Bluesky and shadow profiles
-- ============================================================================

-- Make tweet_id nullable (Bluesky predictions have no tweet_id)
ALTER TABLE public.predictions
  ALTER COLUMN tweet_id DROP NOT NULL;

-- Make user_id nullable (shadow profile predictions have no user_id)
ALTER TABLE public.predictions
  ALTER COLUMN user_id DROP NOT NULL;

-- Add Bluesky-specific columns
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS bluesky_post_uri TEXT       REFERENCES public.bluesky_posts(uri) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS bot_user_id      UUID       REFERENCES public.bot_users(id)      ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source_platform  TEXT       NOT NULL DEFAULT 'twitter'
                                            CHECK (source_platform IN ('twitter', 'bluesky')),
  ADD COLUMN IF NOT EXISTS bot_reply_uri    TEXT,  -- AT URI of the bot's confirmation reply
  ADD COLUMN IF NOT EXISTS bot_reply_cid    TEXT,  -- CID of the bot's confirmation reply (for threading)
  ADD COLUMN IF NOT EXISTS bot_result_uri   TEXT;  -- AT URI of the bot's resolution announcement

-- Enforce: every prediction must have at least one player reference
ALTER TABLE public.predictions
  ADD CONSTRAINT check_has_player
  CHECK (user_id IS NOT NULL OR bot_user_id IS NOT NULL);

-- Enforce: every prediction must reference at least one post
ALTER TABLE public.predictions
  ADD CONSTRAINT check_has_post
  CHECK (tweet_id IS NOT NULL OR bluesky_post_uri IS NOT NULL);

-- Unique pending prediction per shadow-profile user + Bluesky post
CREATE UNIQUE INDEX idx_unique_pending_bsky_prediction
  ON public.predictions(bot_user_id, bluesky_post_uri)
  WHERE status = 'pending'
    AND bot_user_id IS NOT NULL
    AND bluesky_post_uri IS NOT NULL;

-- Index for the resolver: quickly find pending Bluesky predictions due for resolution
CREATE INDEX idx_predictions_bsky_pending
  ON public.predictions(resolve_after)
  WHERE status = 'pending' AND source_platform = 'bluesky';
