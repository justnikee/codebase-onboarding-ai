"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Badge } from "@/types";

const RARITY_COLORS: Record<string, string> = {
  common: "from-zinc-500 to-zinc-600",
  uncommon: "from-green-500 to-green-600",
  rare: "from-blue-500 to-blue-600",
  epic: "from-purple-500 to-purple-600",
  legendary: "from-amber-400 to-orange-500",
};

interface BadgeNotificationProps {
  badge: Badge;
  onDismiss?: () => void;
}

export function BadgeNotification({ badge, onDismiss }: BadgeNotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const gradient = RARITY_COLORS[badge.rarity] ?? RARITY_COLORS.common;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="pointer-events-auto w-full max-w-sm"
        >
          <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
            {/* Gradient accent bar */}
            <div className={`h-1 bg-gradient-to-r ${gradient}`} />

            <div className="flex items-start gap-3 p-4">
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xl">
                🏆
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                  Badge Unlocked!
                </p>
                <p className="mt-0.5 truncate text-sm font-bold text-zinc-100">
                  {badge.name}
                </p>
                {badge.description && (
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {badge.description}
                  </p>
                )}
                {badge.points_bonus > 0 && (
                  <p className="mt-1 text-xs font-medium text-green-400">
                    +{badge.points_bonus} bonus points
                  </p>
                )}
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => {
                  setVisible(false);
                  onDismiss?.();
                }}
                className="shrink-0 text-zinc-500 transition-colors hover:text-zinc-300"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
