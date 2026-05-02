// ============================================================================
// Game mode definitions and daily rotation
//
// Modes cycle daily (UTC day index % 3):
//   Day 0: Viral Verdict  — like growth ≥ 50%
//   Day 1: Repost Rush    — 5+ reposts
//   Day 2: Engagement Bomb — total engagement doubles
// ============================================================================

export type GameMode = "viral_verdict" | "repost_rush" | "engagement_bomb";

export interface MetricsSnapshot {
  likes: number;
  reposts: number;
  replies: number;
}

export interface ModeConfig {
  id: GameMode;
  name: string;
  emoji: string;
  tagline: string;
  goalDescription: string;
  /** Returns true if the prediction outcome counts as "viral" / correct for "viral" side */
  isViral: (initial: MetricsSnapshot, current: MetricsSnapshot) => boolean;
}

const VIRAL_MIN_LIKES    = parseInt(process.env.VIRAL_MIN_LIKES    ?? "10",  10);
const VIRAL_GROWTH_RATE  = parseFloat(process.env.VIRAL_GROWTH_RATE  ?? "0.5");
const REPOST_MIN         = parseInt(process.env.REPOST_MIN          ?? "5",  10);
const ENGAGEMENT_MIN     = parseInt(process.env.ENGAGEMENT_MIN       ?? "15", 10);
const ENGAGEMENT_GROWTH  = parseFloat(process.env.ENGAGEMENT_GROWTH  ?? "1.0"); // 100% growth

export const MODES: Record<GameMode, ModeConfig> = {
  viral_verdict: {
    id: "viral_verdict",
    name: "Viral Verdict",
    emoji: "🚀",
    tagline: "Will it blow up?",
    goalDescription: `${Math.round(VIRAL_GROWTH_RATE * 100)}% like growth + ${VIRAL_MIN_LIKES}+ likes`,
    isViral(initial, current) {
      if (current.likes < VIRAL_MIN_LIKES) return false;
      if (initial.likes === 0) return current.likes >= VIRAL_MIN_LIKES;
      return current.likes >= initial.likes * (1 + VIRAL_GROWTH_RATE);
    },
  },

  repost_rush: {
    id: "repost_rush",
    name: "Repost Rush",
    emoji: "🔁",
    tagline: "Will it get shared?",
    goalDescription: `${REPOST_MIN}+ reposts in the window`,
    isViral(initial, current) {
      return current.reposts >= REPOST_MIN;
    },
  },

  engagement_bomb: {
    id: "engagement_bomb",
    name: "Engagement Bomb",
    emoji: "💥",
    tagline: "Will it explode?",
    goalDescription: `${Math.round(ENGAGEMENT_GROWTH * 100)}% total engagement growth + ${ENGAGEMENT_MIN}+ interactions`,
    isViral(initial, current) {
      const initialTotal = initial.likes + initial.reposts + initial.replies;
      const currentTotal = current.likes + current.reposts + current.replies;
      if (currentTotal < ENGAGEMENT_MIN) return false;
      if (initialTotal === 0) return currentTotal >= ENGAGEMENT_MIN;
      return currentTotal >= initialTotal * (1 + ENGAGEMENT_GROWTH);
    },
  },
};

const MODE_ORDER: GameMode[] = ["viral_verdict", "repost_rush", "engagement_bomb"];

/** Returns the active mode based on current UTC day. */
export function getCurrentMode(): ModeConfig {
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return MODES[MODE_ORDER[dayIndex % MODE_ORDER.length]];
}

/** Returns the mode that will be active tomorrow (UTC). */
export function getNextMode(): ModeConfig {
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return MODES[MODE_ORDER[(dayIndex + 1) % MODE_ORDER.length]];
}

/** Build the daily announcement text posted at UTC midnight. */
export function buildDailyAnnouncementText(botHandle: string, appUrl: string): string {
  const mode = getCurrentMode();
  const next = getNextMode();
  return (
    `🎮 TrendArena Daily Mode: ${mode.emoji} ${mode.name.toUpperCase()}\n\n` +
    `${mode.tagline}\n` +
    `Goal: ${mode.goalDescription}\n\n` +
    `Reply to any Bluesky post and tag @${botHandle} viral/flop to predict!\n\n` +
    `🏆 Leaderboard: ${appUrl}/leaderboard\n` +
    `Tomorrow: ${next.emoji} ${next.name}`
  );
}
