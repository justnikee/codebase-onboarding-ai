-- DevBoard Supabase Schema
-- Run this in your Supabase project: Dashboard → SQL Editor → New Query

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────
-- users
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id     TEXT        UNIQUE NOT NULL,
  email         TEXT,
  name          TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- analyses
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analyses (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        REFERENCES users(id) ON DELETE CASCADE,
  repo_url         TEXT        NOT NULL,
  repo_full_name   TEXT,
  context_id       TEXT        UNIQUE NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'completed',
  summary_snapshot TEXT,
  readiness_score  INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

-- ────────────────────────────────────────────────
-- chat_messages
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id    UUID        REFERENCES analyses(id) ON DELETE CASCADE,
  user_id        UUID        REFERENCES users(id) ON DELETE CASCADE,
  role           TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content        TEXT        NOT NULL,
  relevant_files JSONB       NOT NULL DEFAULT '[]',
  confidence     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- feedback
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID        REFERENCES analyses(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES users(id) ON DELETE CASCADE,
  message_id  UUID        REFERENCES chat_messages(id) ON DELETE SET NULL,
  rating      INTEGER     CHECK (rating BETWEEN 1 AND 5),
  helpful     BOOLEAN,
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- analytics_events
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT        NOT NULL,
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- Indexes
-- ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_analyses_user_id     ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_context_id  ON analyses(context_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at  ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_analysis_id     ON chat_messages(analysis_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_id         ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_id ON feedback(analysis_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id       ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type          ON analytics_events(event_type);

-- ────────────────────────────────────────────────
-- Row Level Security (optional but recommended)
-- ────────────────────────────────────────────────
-- The backend uses the service role key which bypasses RLS.
-- Enable RLS only if you also use the anon/user key from the frontend.

-- ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analyses      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedback      ENABLE ROW LEVEL SECURITY;
