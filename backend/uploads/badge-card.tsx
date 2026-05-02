import type { Badge } from "@/types";

const RARITY_STYLES: Record<
  string,
  { border: string; text: string; glow: string }
> = {
  common: {
    border: "border-zinc-600",
    text: "text-zinc-400",
    glow: "",
  },
  uncommon: {
    border: "border-green-600",
    text: "text-green-400",
    glow: "",
  },
  rare: {
    border: "border-blue-500",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
  },
  epic: {
    border: "border-purple-500",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
  },
  legendary: {
    border: "border-amber-400",
    text: "text-amber-400",
    glow: "shadow-amber-400/30",
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  milestone: "🎯",
  accuracy: "✅",
  streak: "🔥",
  social: "👥",
  special: "⭐",
  general: "🏅",
};

interface BadgeCardProps {
  badge: Badge;
  earned?: boolean;
  awardedAt?: string;
}

export function BadgeCard({ badge, earned = false, awardedAt }: BadgeCardProps) {
  const rarity = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.common;
  const icon = badge.icon_url ?? CATEGORY_ICONS[badge.category] ?? "🏅";

  return (
    <div
      className={`
        relative rounded-xl border p-4 transition-all duration-200
        ${
          earned
            ? `bg-zinc-900 ${rarity.border} shadow-lg ${rarity.glow}`
            : "border-zinc-800 bg-zinc-900/50 opacity-50 grayscale"
        }
      `}
    >
      {/* Rarity label */}
      <span
        className={`absolute right-3 top-3 text-[10px] font-semibold uppercase tracking-wider ${rarity.text}`}
      >
        {badge.rarity}
      </span>

      {/* Icon */}
      <div className="mb-3 text-3xl">{icon}</div>

      {/* Name */}
      <h3 className="text-sm font-bold text-zinc-100">{badge.name}</h3>

      {/* Description */}
      {badge.description && (
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          {badge.description}
        </p>
      )}

      {/* Bonus & date */}
      <div className="mt-3 flex items-center justify-between">
        {badge.points_bonus > 0 && (
          <span className="text-[11px] font-medium text-orange-400">
            +{badge.points_bonus} pts
          </span>
        )}
        {earned && awardedAt && (
          <span className="ml-auto text-[10px] text-zinc-500">
            {new Date(awardedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Lock overlay for unearned badges */}
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
          <span className="text-2xl opacity-60">🔒</span>
        </div>
      )}
    </div>
  );
}
