-- Migration 00005: Game mode rotation
-- Adds game_mode column to predictions so each prediction records
-- which mode was active when it was placed, allowing the resolver
-- to apply the correct win condition even if the mode changes before resolution.

ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS game_mode TEXT NOT NULL DEFAULT 'viral_verdict'
    CHECK (game_mode IN ('viral_verdict', 'repost_rush', 'engagement_bomb'));

COMMENT ON COLUMN public.predictions.game_mode IS
  'Game mode active when the prediction was placed: viral_verdict | repost_rush | engagement_bomb';
