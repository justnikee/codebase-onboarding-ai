// ============================================================================
// Prediction resolver
//
// Runs every RESOLUTION_INTERVAL seconds. Finds pending Bluesky predictions
// whose resolve_after time has passed, checks whether the post went viral,
// and posts:
//   1. A thread reply (in the original conversation)
//   2. A standalone announcement post on the bot's own feed
// ============================================================================
import { fetchPostMetrics, postReply, postStandalone } from "./bluesky.js";
import { getDuePredictions, resolvePrediction } from "./db.js";
import { MODES, type MetricsSnapshot } from "./modes.js";

const POINTS_CORRECT = parseInt(process.env.BOT_POINTS_CORRECT ?? "100", 10);
const POINTS_INCORRECT = parseInt(process.env.BOT_POINTS_INCORRECT ?? "0", 10);
const APP_URL = process.env.APP_URL ?? "https://trendarena.vercel.app";
const BOT_HANDLE = (process.env.BSKY_HANDLE ?? "vovalo.bsky.social").replace(/^@/, "");
const RESOLUTION_INTERVAL_MS = 5 * 60_000;

/** Determine if a prediction's "viral" condition was met, using the stored mode. */
function checkViral(
  gameMode: string,
  initial: MetricsSnapshot,
  current: MetricsSnapshot
): boolean {
  const mode = MODES[gameMode as keyof typeof MODES] ?? MODES.viral_verdict;
  return mode.isViral(initial, current);
}

/** Convert an AT URI to a bsky.app URL */
function atUriToUrl(uri: string, authorHandle?: string): string {
  const parts = uri.split("/");
  const did = parts[2]; // did:plc:xxx
  const rkey = parts[4]; // record key
  const actor = authorHandle ?? did;
  return `https://bsky.app/profile/${actor}/post/${rkey}`;
}

/** Build the in-thread result reply (short, contextual) */
function buildReplyText(
  handle: string,
  wentViral: boolean,
  isCorrect: boolean,
  initialLikes: number,
  currentLikes: number,
  pointsAwarded: number
): string {
  const displayHandle = `@${handle}`;
  const likesDelta = currentLikes - initialLikes;
  const likesLine = `📊 ${initialLikes} → ${currentLikes} likes (+${likesDelta})`;

  if (isCorrect && wentViral) {
    return `🏆 ${displayHandle} called it — VIRAL! 🚀\n${likesLine}\n+${pointsAwarded} pts! 🎮 ${APP_URL}/leaderboard`;
  } else if (isCorrect && !wentViral) {
    return `🏆 ${displayHandle} called it — FLOPPED! 💤\n${likesLine}\n+${pointsAwarded} pts! 🎮 ${APP_URL}/leaderboard`;
  } else if (!isCorrect && wentViral) {
    return `❌ ${displayHandle} said flop but it WENT VIRAL! 🚀\n${likesLine}\nBetter luck next time! ${APP_URL}`;
  } else {
    return `❌ ${displayHandle} said viral but it FLOPPED! 💤\n${likesLine}\nBetter luck next time! ${APP_URL}`;
  }
}

/** Build the standalone public announcement (shown on bot's feed) */
function buildAnnouncementText(
  handle: string,
  wentViral: boolean,
  isCorrect: boolean,
  initialLikes: number,
  currentLikes: number,
  pointsAwarded: number,
  postUrl: string
): string {
  const displayHandle = `@${handle}`;
  const likesDelta = currentLikes - initialLikes;
  const cta = `\n\n🎮 Tag @${BOT_HANDLE} viral/flop on any post to play!`;

  let headline: string;
  if (isCorrect && wentViral) {
    headline = `🏆 Arena Result!\n🚀 VIRAL — ${displayHandle} called it!\n📊 Likes: ${initialLikes} → ${currentLikes} (+${likesDelta})\n+${pointsAwarded} pts earned 🎯`;
  } else if (isCorrect && !wentViral) {
    headline = `🏆 Arena Result!\n💤 FLOPPED — ${displayHandle} called it!\n📊 Likes: ${initialLikes} → ${currentLikes} (no surge)\n+${pointsAwarded} pts earned 🎯`;
  } else if (!isCorrect && wentViral) {
    headline = `🎮 Arena Result\n🚀 WENT VIRAL but ${displayHandle} said flop!\n📊 Likes: ${initialLikes} → ${currentLikes} (+${likesDelta})\nBetter luck next time!`;
  } else {
    headline = `🎮 Arena Result\n💤 FLOPPED but ${displayHandle} said viral!\n📊 Likes: ${initialLikes} → ${currentLikes} (no surge)\nBetter luck next time!`;
  }

  return `${headline}\n\n${postUrl}${cta}`;
}

async function runCycle(): Promise<void> {
  const predictions = await getDuePredictions();
  if (predictions.length === 0) return;

  console.log(`[resolver] Resolving ${predictions.length} prediction(s)...`);

  for (const prediction of predictions) {
    try {
      const metrics = await fetchPostMetrics(prediction.bluesky_post_uri);

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

      const initialSnapshot: MetricsSnapshot = {
        likes:   (prediction.metrics_at_prediction?.like_count   as number | undefined) ?? 0,
        reposts: (prediction.metrics_at_prediction?.repost_count as number | undefined) ?? 0,
        replies: (prediction.metrics_at_prediction?.reply_count  as number | undefined) ?? 0,
      };
      const currentSnapshot: MetricsSnapshot = {
        likes:   metrics.like_count,
        reposts: metrics.repost_count,
        replies: metrics.reply_count,
      };
      const gameMode = (prediction as any).game_mode ?? "viral_verdict";
      const wentViral = checkViral(gameMode, initialSnapshot, currentSnapshot);
      const isCorrect = prediction.predicted_viral === wentViral;
      const pointsAwarded = isCorrect ? POINTS_CORRECT : POINTS_INCORRECT;

      const handle = prediction.bot_users?.bluesky_handle ?? "predictor";
      const authorHandle = prediction.bluesky_posts?.author_handle;
      const originalPostUrl = atUriToUrl(prediction.bluesky_post_uri, authorHandle);
      const initialLikes  = initialSnapshot.likes;
      const currentLikes  = currentSnapshot.likes;

      // 1. Thread reply (contextual, inside the original conversation)
      let resultUri: string | undefined;
      if (prediction.bot_reply_uri && prediction.bot_reply_cid) {
        try {
          const confirmRef = {
            uri: prediction.bot_reply_uri,
            cid: prediction.bot_reply_cid,
          };
          const replyText = buildReplyText(
            handle, wentViral, isCorrect, initialLikes, currentLikes, pointsAwarded
          );
          const result = await postReply(replyText, confirmRef, confirmRef);
          resultUri = result.uri;
        } catch (replyErr: unknown) {
          console.warn(
            `[resolver] Could not post thread reply for ${prediction.id}:`,
            (replyErr as Error).message
          );
        }
      }

      // 2. Standalone announcement on the bot's public feed
      try {
        const announcementText = buildAnnouncementText(
          handle, wentViral, isCorrect, initialLikes, currentLikes,
          pointsAwarded, originalPostUrl
        );
        await postStandalone(announcementText);
      } catch (announceErr: unknown) {
        // Non-fatal — thread reply already posted
        console.warn(
          `[resolver] Could not post announcement for ${prediction.id}:`,
          (announceErr as Error).message
        );
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

      // Small delay between resolutions to avoid rate-limiting on announcements
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err: unknown) {
      console.error(
        `[resolver] Error resolving ${prediction.id}:`,
        (err as Error).message
      );
    }
  }
}

export function startResolver(): void {
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

