import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchPosts } from "@/lib/bluesky/client";
import {
  POINTS_CORRECT,
  POINTS_CORRECT_HIGH_CONFIDENCE,
  POINTS_CORRECT_LOW_CONFIDENCE,
  POINTS_INCORRECT_HIGH_CONFIDENCE,
  POINTS_INCORRECT,
} from "@/config/constants";
import { trackPredictionResolved } from "@/lib/telemetry/events";
import type { TweetMetrics, ConfidenceLevel } from "@/types";
import { checkAndAwardBadges } from "@/lib/badges/engine";

// Verify cron secret to prevent unauthorized triggers
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // Allow in dev
  return authHeader === `Bearer ${cronSecret}`;
}

function calculatePoints(
  isCorrect: boolean,
  confidence: ConfidenceLevel
): number {
  if (isCorrect) {
    if (confidence === "high") return POINTS_CORRECT_HIGH_CONFIDENCE;
    if (confidence === "low") return POINTS_CORRECT_LOW_CONFIDENCE;
    return POINTS_CORRECT;
  }
  if (confidence === "high") return POINTS_INCORRECT_HIGH_CONFIDENCE;
  return POINTS_INCORRECT;
}

function isViral(metrics: TweetMetrics, threshold: number): boolean {
  return metrics.like_count >= threshold;
}

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    // Get active default threshold
    const { data: thresholdRow } = await admin
      .from("virality_thresholds")
      .select("*")
      .eq("is_default", true)
      .eq("is_active", true)
      .single();

    const threshold = thresholdRow?.threshold_value ?? 10000;

    // Fetch pending predictions ready for resolution
    const { data: pending, error: fetchError } = await admin
      .from("predictions")
      .select("id, user_id, tweet_id, predicted_viral, confidence, metrics_at_prediction")
      .eq("status", "pending")
      .lte("resolve_after", new Date().toISOString())
      .limit(100); // Process in batches of 100

    if (fetchError || !pending || pending.length === 0) {
      return NextResponse.json({
        resolved: 0,
        message: pending ? "No pending predictions" : fetchError?.message,
      });
    }

    // Deduplicate post URIs for batch fetch
    const uniquePostUris = [...new Set(pending.map((p: { tweet_id: string }) => p.tweet_id))];

    // Batch fetch from Bluesky (max 25 per call, handled inside fetchPosts)
    const freshPosts = await fetchPosts(uniquePostUris as string[]);
    const metricsMap = new Map<string, TweetMetrics>();
    for (const p of freshPosts) {
      metricsMap.set(p.uri, p.metrics as unknown as TweetMetrics);
    }

    // Update cached posts
    for (const p of freshPosts) {
      await admin
        .from("tweets")
        .update({
          metrics_latest: p.metrics as any,
          last_fetched_at: new Date().toISOString(),
        })
        .eq("id", p.uri);
    }

    // Resolve each prediction
    let resolvedCount = 0;
    const now = new Date().toISOString();

    for (const pred of pending) {
      const latestMetrics = metricsMap.get(pred.tweet_id);
      if (!latestMetrics) {
        // Tweet deleted or unavailable — expire the prediction
        await admin
          .from("predictions")
          .update({ status: "expired", resolved_at: now })
          .eq("id", pred.id);
        continue;
      }

      const viral = isViral(latestMetrics, threshold);
      const correct = pred.predicted_viral === viral;
      const points = calculatePoints(correct, pred.confidence as ConfidenceLevel);

      // Update prediction (triggers handle_prediction_resolved for profile counters)
      await admin
        .from("predictions")
        .update({
          status: "resolved",
          is_correct: correct,
          points_awarded: Math.max(points, 0), // No negative in DB, handle via trigger
          metrics_at_resolution: latestMetrics as any,
          threshold_used: { metric: "likes", value: threshold } as any,
          resolved_at: now,
        })
        .eq("id", pred.id);

      // Create notification
      await admin.from("notifications").insert({
        user_id: pred.user_id,
        type: "prediction_resolved",
        title: correct ? "🎉 Correct Prediction!" : "❌ Better luck next time",
        body: correct
          ? `You earned ${points} points! The tweet ${viral ? "went viral" : "didn't go viral"} as you predicted.`
          : `The tweet ${viral ? "went viral" : "didn't go viral"}. Keep predicting!`,
        data: {
          prediction_id: pred.id,
          tweet_id: pred.tweet_id,
          is_correct: correct,
          points_awarded: points,
        } as any,
      });

      // Log telemetry (fire-and-forget)
      trackPredictionResolved(pred.user_id, pred.id, correct, points);

      // Check and award any newly earned badges
      await checkAndAwardBadges(pred.user_id);

      resolvedCount++;
    }

    return NextResponse.json({
      resolved: resolvedCount,
      total_pending: pending.length,
    });
  } catch (err) {
    console.error("Resolution error:", err);
    return NextResponse.json(
      { error: "Resolution job failed" },
      { status: 500 }
    );
  }
}
