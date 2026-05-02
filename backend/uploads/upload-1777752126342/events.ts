import { createAdminClient } from "@/lib/supabase/admin";
import type { EventInsert } from "@/types";

/**
 * Fire-and-forget event tracking. Errors are logged but never thrown.
 */
export function trackEvent(
  type: string,
  userId?: string,
  payload?: Record<string, unknown>,
  metadata?: Record<string, unknown>
): void {
  try {
    const admin = createAdminClient();
    const row: EventInsert = {
      type,
      user_id: userId ?? null,
      payload: payload as EventInsert["payload"],
      metadata: metadata as EventInsert["metadata"],
    };

    admin
      .from("events")
      .insert(row)
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) console.error(`[telemetry] Failed to track "${type}":`, error.message);
      })
      .then(undefined, (err: unknown) => {
        console.error(`[telemetry] Failed to track "${type}":`, err);
      });
  } catch (err) {
    console.error(`[telemetry] Failed to track "${type}":`, err);
  }
}

export function trackLogin(userId: string): void {
  trackEvent("login", userId);
}

export function trackPredictionSubmitted(
  userId: string,
  predictionId: string,
  tweetId: string,
  predictedViral: boolean
): void {
  trackEvent("prediction_submitted", userId, {
    prediction_id: predictionId,
    tweet_id: tweetId,
    predicted_viral: predictedViral,
  });
}

export function trackPredictionResolved(
  userId: string,
  predictionId: string,
  isCorrect: boolean,
  pointsAwarded: number
): void {
  trackEvent("prediction_resolved", userId, {
    prediction_id: predictionId,
    is_correct: isCorrect,
    points_awarded: pointsAwarded,
  });
}

export function trackBadgeAwarded(userId: string, badgeId: string): void {
  trackEvent("badge_awarded", userId, { badge_id: badgeId });
}

export function trackApiError(
  endpoint: string,
  error: string,
  userId?: string
): void {
  trackEvent("api_error", userId, { endpoint, error });
}
