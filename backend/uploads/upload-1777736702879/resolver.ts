// ============================================================================
// Prediction resolver
//
// Runs every RESOLUTION_INTERVAL seconds. Finds pending Bluesky predictions
// whose resolve_after time has passed, checks whether the post went viral,
// and posts a public result reply.
// ============================================================================
import { fetchPostMetrics, postReply } from "./bluesky.js";
import { getDuePredictions, resolvePrediction } from "./db.js";

const VIRAL_GROWTH_RATE = parseFloat(process.env.VIRAL_GROWTH_RATE ?? "0.5");
const VIRAL_MIN_LIKES = parseInt(process.env.VIRAL_MIN_LIKES ?? "10", 10);
const POINTS_CORRECT = parseInt(process.env.BOT_POINTS_CORRECT ?? "100", 10);
const POINTS_INCORRECT = parseInt(process.env.BOT_POINTS_INCORRECT ?? "0", 10);
const APP_URL = process.env.APP_URL ?? "https://trendarena.app";
const RESOLUTION_INTERVAL_MS = 5 * 60_000; // check every 5 minutes

function isViral(initialLikes: number, currentLikes: number): boolean {
  if (currentLikes < VIRAL_MIN_LIKES) return false;
  if (initialLikes === 0) return currentLikes >= VIRAL_MIN_LIKES;
  return currentLikes >= initialLikes * (1 + VIRAL_GROWTH_RATE);
}

async function runCycle(): Promise<void> {
  const predictions = await getDuePredictions();
  if (predictions.length === 0) return;

  console.log(`[resolver] Resolving ${predictions.length} prediction(s)...`);

  for (const prediction of predictions) {
    try {
      const metrics = await fetchPostMetrics(prediction.bluesky_post_uri);

      // Post was deleted — expire the prediction without awarding points
      if (!metrics) {
        await resolvePrediction({
          id: prediction.id,
          isCorrect: false,
          pointsAwarded: 0,
          metricsAtResolution: {},
          status: "expired",
        });
        console.log(`[resolver] Expired ${prediction.id} (post deleted)`);
        continue;
      }

      const initialLikes =
        (prediction.metrics_at_prediction?.like_count as number | undefined) ?? 0;
      const currentLikes = metrics.like_count;
      const wentViral = isViral(initialLikes, currentLikes);
      const isCorrect = prediction.predicted_viral === wentViral;
      const pointsAwarded = isCorrect ? POINTS_CORRECT : POINTS_INCORRECT;

      // Build the result announcement text
      const handle = prediction.bot_users?.bluesky_handle ?? "predictor";
      const displayHandle = handle.startsWith("did:") ? handle : `@${handle}`;
      const likesDelta = currentLikes - initialLikes;

      let resultText: string;
      if (wentViral && isCorrect) {
        resultText =
          `🏆 ${displayHandle} called it! WENT VIRAL 🚀\n` +
          `Likes: ${initialLikes} → ${currentLikes} (+${likesDelta})\n` +
          `+${pointsAwarded} pts awarded! 🎮 ${APP_URL}/leaderboard`;
      } else if (wentViral && !isCorrect) {
        resultText =
          `❌ ${displayHandle} predicted FLOP but it WENT VIRAL 🚀\n` +
          `Likes: ${initialLikes} → ${currentLikes} (+${likesDelta})\n` +
          `Better luck next time! ${APP_URL}`;
      } else if (!wentViral && isCorrect) {
        resultText =
          `🏆 ${displayHandle} called it! FLOPPED as predicted 💤\n` +
          `Likes: ${initialLikes} → ${currentLikes} (no surge)\n` +
          `+${pointsAwarded} pts awarded! 🎮 ${APP_URL}/leaderboard`;
      } else {
        resultText =
          `❌ ${displayHandle} predicted VIRAL but it FLOPPED 💤\n` +
          `Likes: ${initialLikes} → ${currentLikes}\n` +
          `Better luck next time! ${APP_URL}`;
      }

      // Post the result as a reply to our original confirmation reply (if available)
      let resultUri: string | undefined;
      if (prediction.bot_reply_uri && prediction.bot_reply_cid) {
        try {
          const confirmRef = {
            uri: prediction.bot_reply_uri,
            cid: prediction.bot_reply_cid,
          };
          const result = await postReply(resultText, confirmRef, confirmRef);
          resultUri = result.uri;
        } catch (replyErr: unknown) {
          console.warn(
            `[resolver] Could not post result reply for ${prediction.id}:`,
            (replyErr as Error).message
          );
        }
      }

      await resolvePrediction({
        id: prediction.id,
        isCorrect,
        pointsAwarded,
        metricsAtResolution: {
          like_count: metrics.like_count,
          repost_count: metrics.repost_count,
          reply_count: metrics.reply_count,
        },
        botResultUri: resultUri,
      });

      console.log(
        `[resolver] ${isCorrect ? "✅" : "❌"} ${prediction.id} — ` +
          `${wentViral ? "viral" : "flop"}, +${pointsAwarded}pts for @${handle}`
      );
    } catch (err: unknown) {
      console.error(
        `[resolver] Error resolving ${prediction.id}:`,
        (err as Error).message
      );
    }
  }
}

export function startResolver(): void {
  // Run immediately so any backlogged predictions are resolved on startup
  runCycle().catch((err: unknown) =>
    console.error("[resolver] Startup cycle failed:", (err as Error).message)
  );

  setInterval(() => {
    runCycle().catch((err: unknown) =>
      console.error("[resolver] Cycle failed:", (err as Error).message)
    );
  }, RESOLUTION_INTERVAL_MS);

  console.log(`[resolver] Started (interval: ${RESOLUTION_INTERVAL_MS / 1000}s)`);
}
