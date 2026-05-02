// ============================================================================
// Supabase data layer for the bot
// ============================================================================
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Types ──────────────────────────────────────────────────────────────────

export interface BotUser {
  id: string;
  bluesky_did: string;
  bluesky_handle: string;
  points: number;
  level: number;
  predictions_count: number;
  correct_predictions: number;
  is_claimed: boolean;
}

export interface BskyPrediction {
  id: string;
  bot_user_id: string;
  bluesky_post_uri: string;
  predicted_viral: boolean;
  metrics_at_prediction: Record<string, number>;
  resolve_after: string;
  bot_reply_uri: string | null;
  bot_reply_cid: string | null;
  status: string;
  game_mode: string;
}

export interface DuePrediction extends BskyPrediction {
  bot_users: BotUser;
  bluesky_posts: { cid: string; author_handle: string } | null;
}

// ── Shadow profile ─────────────────────────────────────────────────────────

/** Find an existing bot_user by DID, or create a new shadow profile. */
export async function findOrCreateBotUser(
  did: string,
  handle: string
): Promise<BotUser> {
  const { data: existing } = await supabase
    .from("bot_users")
    .select("*")
    .eq("bluesky_did", did)
    .single();

  if (existing) {
    // Keep handle up-to-date in case they changed it
    if (existing.bluesky_handle !== handle) {
      await supabase
        .from("bot_users")
        .update({ bluesky_handle: handle })
        .eq("id", existing.id);
    }
    return existing as BotUser;
  }

  const { data: created, error } = await supabase
    .from("bot_users")
    .insert({ bluesky_did: did, bluesky_handle: handle })
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(
      `Failed to create shadow profile for ${handle}: ${error?.message}`
    );
  }
  return created as BotUser;
}

// ── Bluesky post cache ─────────────────────────────────────────────────────

export interface UpsertPostParams {
  uri: string;
  cid: string;
  author_did: string;
  author_handle: string;
  text: string;
  like_count: number;
  repost_count: number;
  reply_count: number;
  post_created_at?: string;
}

export async function upsertBlueskyPost(
  params: UpsertPostParams
): Promise<void> {
  const metrics = {
    like_count: params.like_count,
    repost_count: params.repost_count,
    reply_count: params.reply_count,
  };

  const { error } = await supabase.from("bluesky_posts").upsert(
    {
      uri: params.uri,
      cid: params.cid,
      author_did: params.author_did,
      author_handle: params.author_handle,
      text: params.text,
      metrics_initial: metrics,
      metrics_latest: metrics,
      post_created_at: params.post_created_at ?? null,
      last_fetched_at: new Date().toISOString(),
    },
    { onConflict: "uri" }
  );

  if (error) {
    throw new Error(`Failed to cache bluesky post ${params.uri}: ${error.message}`);
  }
}

// ── Predictions ────────────────────────────────────────────────────────────

export interface CreatePredictionParams {
  botUserId: string;
  blueskyPostUri: string;
  predictedViral: boolean;
  metricsAtPrediction: Record<string, number>;
  resolveAfterMinutes: number;
  gameMode: string;
}

/**
 * Insert a pending prediction. Returns null if the user already has a
 * pending prediction on the same post (duplicate constraint).
 */
export async function createBskyPrediction(
  params: CreatePredictionParams
): Promise<BskyPrediction | null> {
  const resolveAfter = new Date(
    Date.now() + params.resolveAfterMinutes * 60_000
  ).toISOString();

  const { data, error } = await supabase
    .from("predictions")
    .insert({
      bot_user_id: params.botUserId,
      bluesky_post_uri: params.blueskyPostUri,
      predicted_viral: params.predictedViral,
      confidence: "normal",
      status: "pending",
      points_awarded: 0,
      metrics_at_prediction: params.metricsAtPrediction,
      resolve_after: resolveAfter,
      source_platform: "bluesky",
      game_mode: params.gameMode,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return null; // duplicate pending prediction
    throw new Error(`Failed to create prediction: ${error.message}`);
  }
  return data as BskyPrediction;
}

/** Store the bot's confirmation reply URI + CID on the prediction record. */
export async function updatePredictionReplyRef(
  predictionId: string,
  replyUri: string,
  replyCid: string
): Promise<void> {
  await supabase
    .from("predictions")
    .update({ bot_reply_uri: replyUri, bot_reply_cid: replyCid })
    .eq("id", predictionId);
}

/** Fetch all pending Bluesky predictions whose resolve_after has passed. */
export async function getDuePredictions(): Promise<DuePrediction[]> {
  const { data, error } = await supabase
    .from("predictions")
    .select("*, bot_users(*), bluesky_posts(cid, author_handle), game_mode")
    .eq("status", "pending")
    .eq("source_platform", "bluesky")
    .lte("resolve_after", new Date().toISOString());

  if (error) throw new Error(`Failed to fetch due predictions: ${error.message}`);
  return (data ?? []) as DuePrediction[];
}

export interface ResolvePredictionParams {
  id: string;
  isCorrect: boolean;
  pointsAwarded: number;
  metricsAtResolution: Record<string, number>;
  status?: "resolved" | "expired";
  botResultUri?: string;
}

/** Resolve a prediction and update the shadow profile's score. */
export async function resolvePrediction(
  params: ResolvePredictionParams
): Promise<void> {
  const { data: prediction, error: predErr } = await supabase
    .from("predictions")
    .update({
      status: params.status ?? "resolved",
      is_correct: params.isCorrect,
      points_awarded: params.pointsAwarded,
      metrics_at_resolution: params.metricsAtResolution,
      bot_result_uri: params.botResultUri ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select("bot_user_id")
    .single();

  if (predErr || !prediction?.bot_user_id) return;

  // Update the bot_user's denormalized counters atomically via RPC or fetch+update
  const { data: user } = await supabase
    .from("bot_users")
    .select("points, level, predictions_count, correct_predictions")
    .eq("id", prediction.bot_user_id)
    .single();

  if (user) {
    const newPoints = user.points + params.pointsAwarded;
    await supabase
      .from("bot_users")
      .update({
        points: newPoints,
        level: Math.floor(newPoints / 100) + 1,
        predictions_count: user.predictions_count + 1,
        correct_predictions: user.correct_predictions + (params.isCorrect ? 1 : 0),
      })
      .eq("id", prediction.bot_user_id);
  }
}

/** Get a bot_user's stats by their Bluesky DID. */
export async function getBotUserStats(did: string): Promise<BotUser | null> {
  const { data } = await supabase
    .from("bot_users")
    .select("*")
    .eq("bluesky_did", did)
    .single();
  return (data as BotUser) ?? null;
}
