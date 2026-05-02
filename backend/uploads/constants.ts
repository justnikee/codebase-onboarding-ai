// ============================================================================
// App-wide constants — single source of truth
// ============================================================================

export const APP_NAME = "TrendArena";
export const APP_DESCRIPTION = "Predict which tweets go viral. Compete on the leaderboard.";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Scoring
export const POINTS_CORRECT = 10;
export const POINTS_CORRECT_HIGH_CONFIDENCE = 20;
export const POINTS_CORRECT_LOW_CONFIDENCE = 5;
export const POINTS_INCORRECT_HIGH_CONFIDENCE = -5;
export const POINTS_INCORRECT = 0;
export const POINTS_REFERRAL_BONUS = 25;
export const LEVEL_DIVISOR = 100; // level = points / LEVEL_DIVISOR + 1

// Prediction rules
export const PREDICTION_RESOLVE_WINDOW_MINUTES = 60;
export const MAX_PREDICTIONS_PER_MINUTE = 5;
export const MAX_PREDICTIONS_PER_DAY = 50;

// Leaderboard
export const LEADERBOARD_PAGE_SIZE = 20;
export const LEADERBOARD_MAX_RANK = 100;

// Bluesky API
export const BSKY_API_BASE = "https://public.api.bsky.app/xrpc";
export const BSKY_POST_URL_REGEX = /bsky\.app\/profile\/([^/]+)\/post\/([a-zA-Z0-9]+)/;
export const BSKY_POST_AT_URI_REGEX = /^at:\/\/[^/]+\/app\.bsky\.feed\.post\/[a-zA-Z0-9]+$/;

// Cache TTL (seconds)
export const POST_CACHE_TTL = 300; // 5 minutes

// Rate limiting windows
export const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
