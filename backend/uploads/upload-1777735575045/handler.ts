// ============================================================================
// Mention handler
//
// Processes a Jetstream post event that mentions the bot:
//   1. Parses the command from the post text.
//   2. Resolves or creates a shadow profile for the author.
//   3. Creates a prediction record and posts a confirmation reply.
// ============================================================================
import { parseCommand } from "./commands.js";
import {
  agent,
  fetchPostMetrics,
  postReply,
  resolveHandleFromDid,
} from "./bluesky.js";
import {
  findOrCreateBotUser,
  upsertBlueskyPost,
  createBskyPrediction,
  updatePredictionReplyRef,
  getBotUserStats,
} from "./db.js";
import { getCurrentMode } from "./modes.js";
import type { JetstreamPost } from "./jetstream.js";

const RESOLVE_MINUTES = parseInt(
  process.env.PREDICTION_RESOLVE_MINUTES ?? "60",
  10
);
const APP_URL = process.env.APP_URL ?? "https://trendarena.vercel.app";
const BOT_HANDLE = process.env.BSKY_HANDLE!;

export async function handleMention(post: JetstreamPost): Promise<void> {
  const cmd = parseCommand(post.record.text, BOT_HANDLE);

  // The bot's reply is always a child of the incoming mention
  const parentRef = { uri: post.uri, cid: post.cid };
  // The thread root is the mention's own root, or the mention itself if top-level
  const rootRef = post.record.reply?.root ?? parentRef;

  // ── help ──────────────────────────────────────────────────────────────
  if (cmd.type === "help") {
    const mode = getCurrentMode();
    const helpText =
      `🎮 TrendArena — Predict Bluesky virality!\n\n` +
      `Today's mode: ${mode.emoji} ${mode.name}\n` +
      `Goal: ${mode.goalDescription}\n\n` +
      `Reply to any post + tag me:\n` +
      `• "@${BOT_HANDLE} viral" → predict it wins 🚀\n` +
      `• "@${BOT_HANDLE} flop"  → predict it doesn't 💤\n` +
      `• "@${BOT_HANDLE} stats" → your score 📊\n\n` +
      `Results in ${RESOLVE_MINUTES} mins. 🏆 ${APP_URL}/leaderboard`;
    await postReply(helpText, parentRef, rootRef);
    return;
  }

  // ── stats ─────────────────────────────────────────────────────────────
  if (cmd.type === "stats") {
    const stats = await getBotUserStats(post.did);

    if (!stats || stats.predictions_count === 0) {
      await postReply(
        `📊 No predictions yet! Reply to any post with "@${BOT_HANDLE} viral" to start. 🎮`,
        parentRef,
        rootRef
      );
      return;
    }

    const accuracy = Math.round(
      (stats.correct_predictions / stats.predictions_count) * 100
    );
    await postReply(
      `📊 Your TrendArena stats:\n` +
        `• Points: ${stats.points} (Lv ${stats.level})\n` +
        `• Predictions: ${stats.predictions_count} (${accuracy}% accuracy)\n\n` +
        `Full leaderboard: ${APP_URL}/leaderboard`,
      parentRef,
      rootRef
    );
    return;
  }

  // ── viral / flop prediction ───────────────────────────────────────────
  if (cmd.type === "viral") {
    // The predicted post is the direct parent of the mention in the thread
    if (!post.record.reply) {
      await postReply(
        `❌ To predict, reply to a post and tag me.\n` +
          `Example: reply to a post with "@${BOT_HANDLE} viral"\n\n` +
          `Need help? "@${BOT_HANDLE} help"`,
        parentRef,
        rootRef
      );
      return;
    }

    const targetUri = post.record.reply.parent.uri;
    const targetCid = post.record.reply.parent.cid;

    // Fetch current metrics of the target post
    const metrics = await fetchPostMetrics(targetUri);
    if (!metrics) {
      await postReply(
        `❌ Couldn't read that post — it may have been deleted or is private.`,
        parentRef,
        rootRef
      );
      return;
    }

    // Cache the post in bluesky_posts
    const authorDid = targetUri.split("/")[2] ?? "";
    let authorHandle = authorDid;
    try {
      const profile = await agent.getProfile({ actor: authorDid });
      authorHandle = profile.data.handle;
    } catch { /* keep DID as fallback */ }

    await upsertBlueskyPost({
      uri: targetUri,
      cid: targetCid,
      author_did: authorDid,
      author_handle: authorHandle,
      text: "",
      like_count: metrics.like_count,
      repost_count: metrics.repost_count,
      reply_count: metrics.reply_count,
    });

    // Resolve or create shadow profile for the person mentioning the bot
    const mentionerHandle = await resolveHandleFromDid(post.did);
    const botUser = await findOrCreateBotUser(post.did, mentionerHandle);

    // Create the prediction record
    const prediction = await createBskyPrediction({
      botUserId: botUser.id,
      blueskyPostUri: targetUri,
      predictedViral: cmd.predictedViral,
      metricsAtPrediction: {
        like_count: metrics.like_count,
        repost_count: metrics.repost_count,
        reply_count: metrics.reply_count,
      },
      resolveAfterMinutes: RESOLVE_MINUTES,
      gameMode: getCurrentMode().id,
    });

    if (!prediction) {
      // Duplicate pending prediction
      await postReply(
        `⚠️ You already have a pending prediction on that post!\n` +
          `Check back in ${RESOLVE_MINUTES} mins for the result. 🎯`,
        parentRef,
        rootRef
      );
      return;
    }

    // Post confirmation reply (includes current mode context)
    const mode = getCurrentMode();
    const label = cmd.predictedViral ? "🚀 VIRAL" : "💤 FLOP";
    const confirmText =
      `${label} prediction locked in! ✅\n\n` +
      `${mode.emoji} Mode: ${mode.name} — ${mode.goalDescription}\n\n` +
      `Result in ${RESOLVE_MINUTES} mins — correct = +${process.env.BOT_POINTS_CORRECT ?? 100} pts!\n` +
      `🏆 ${APP_URL}/leaderboard`;

    const reply = await postReply(confirmText, parentRef, rootRef);
    await updatePredictionReplyRef(prediction.id, reply.uri, reply.cid);

    console.log(
      `[handler] ${label} prediction ${prediction.id} by @${mentionerHandle} on ${targetUri}`
    );
    return;
  }

  // ── unknown command ───────────────────────────────────────────────────
  await postReply(
    `🤔 Unknown command. Try:\n` +
      `• "@${BOT_HANDLE} viral" — predict it blows up\n` +
      `• "@${BOT_HANDLE} flop"  — predict it doesn't\n` +
      `• "@${BOT_HANDLE} help"  — full command list`,
    parentRef,
    rootRef
  );
}
