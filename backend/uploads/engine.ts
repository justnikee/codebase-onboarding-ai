import { createAdminClient } from "@/lib/supabase/admin";
import type { Badge, Json } from "@/types";

/**
 * Checks a user's profile stats against all active badges and awards any
 * newly earned badges.  Designed to be called after points/stats are updated
 * (e.g. after prediction resolution or referral completion).
 *
 * Returns the list of newly awarded Badge rows (empty array if none).
 */
export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const admin = createAdminClient();

  // ---------- fetch data in parallel ----------
  const [profileRes, badgesRes, earnedRes, referralsRes] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).single(),
    admin.from("badges").select("*").eq("is_active", true).order("sort_order"),
    admin.from("user_badges").select("badge_id").eq("user_id", userId),
    admin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId),
  ]);

  if (profileRes.error || !profileRes.data) return [];

  const profile = profileRes.data;
  const allBadges = badgesRes.data ?? [];
  const earnedSet = new Set(
    (earnedRes.data ?? []).map((ub: { badge_id: string }) => ub.badge_id)
  );
  const referralCount = referralsRes.count ?? 0;

  // Compute accuracy percentage once
  const accuracyPct =
    profile.predictions_count > 0
      ? Math.round(
          (profile.correct_predictions / profile.predictions_count) * 100
        )
      : 0;

  // ---------- determine newly eligible badges ----------
  const newlyEligible: Badge[] = [];

  for (const badge of allBadges) {
    if (earnedSet.has(badge.id)) continue; // already awarded

    const val = badge.requirement_value;
    if (val === null && badge.requirement_type !== "custom") continue;

    let eligible = false;

    switch (badge.requirement_type) {
      case "predictions_count":
        eligible = profile.predictions_count >= val!;
        break;
      case "correct_count":
        eligible = profile.correct_predictions >= val!;
        break;
      case "points":
        eligible = profile.points >= val!;
        break;
      case "streak":
        eligible = profile.streak_best >= val!;
        break;
      case "referrals":
        eligible = referralCount >= val!;
        break;
      case "accuracy_pct":
        eligible =
          profile.predictions_count >= 10 && accuracyPct >= val!;
        break;
      case "custom":
        // Custom badges are awarded through other mechanisms
        break;
    }

    if (eligible) {
      newlyEligible.push(badge);
    }
  }

  if (newlyEligible.length === 0) return [];

  // ---------- award badges + notify ----------
  for (const badge of newlyEligible) {
    // Insert into user_badges (unique constraint prevents duplicates)
    const { error: insertErr } = await admin.from("user_badges").insert({
      user_id: userId,
      badge_id: badge.id,
    });

    if (insertErr) {
      // Likely a duplicate race condition — skip silently
      continue;
    }

    // Award bonus points (if any) — re-fetch current points to avoid stale reads
    if (badge.points_bonus > 0) {
      const { data: freshProfile } = await admin
        .from("profiles")
        .select("points")
        .eq("id", userId)
        .single();
      if (freshProfile) {
        await admin
          .from("profiles")
          .update({ points: freshProfile.points + badge.points_bonus })
          .eq("id", userId);
      }
    }

    // Create notification
    await admin.from("notifications").insert({
      user_id: userId,
      type: "badge_awarded" as const,
      title: `🏆 Badge Unlocked: ${badge.name}!`,
      body: badge.description ?? `You earned the ${badge.name} badge!`,
      data: {
        badge_id: badge.id,
        badge_name: badge.name,
        badge_rarity: badge.rarity,
        badge_icon: badge.icon_url,
        points_bonus: badge.points_bonus,
      } as unknown as Json,
    });
  }

  return newlyEligible;
}
