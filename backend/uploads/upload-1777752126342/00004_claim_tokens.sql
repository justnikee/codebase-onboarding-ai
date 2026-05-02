-- Migration 00004: Bluesky account claiming
-- Adds claim_tokens table and links bluesky identity to profiles

-- ── 1. Add Bluesky identity columns to profiles ─────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bluesky_did    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS bluesky_handle TEXT;

-- ── 2. Claim tokens table ────────────────────────────────────────────────────
-- Stores short-lived tokens used to verify Bluesky ownership.
-- Flow: user enters handle → token generated → user posts it on Bluesky →
--       we fetch their public feed to confirm → merge bot_user → token used.

CREATE TABLE IF NOT EXISTS public.claim_tokens (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bluesky_handle TEXT        NOT NULL,
  token          TEXT        NOT NULL UNIQUE,
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '2 hours'),
  used_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_tokens_profile ON public.claim_tokens(profile_id);
CREATE INDEX IF NOT EXISTS idx_claim_tokens_token   ON public.claim_tokens(token);

-- Only the owner can read their own tokens (anon/public cannot access)
ALTER TABLE public.claim_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own claim tokens"
  ON public.claim_tokens FOR SELECT
  USING (auth.uid() = profile_id);

-- Service role (API routes using admin client) bypasses RLS — that's intentional.

-- ── 3. Allow anon reads on bot_users (for leaderboard) ───────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bot_users'
      AND policyname = 'Anyone can view bot users'
  ) THEN
    CREATE POLICY "Anyone can view bot users"
      ON public.bot_users FOR SELECT
      USING (true);
  END IF;
END $$;
