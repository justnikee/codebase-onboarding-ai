import { z } from "zod";
import { BSKY_POST_URL_REGEX, BSKY_POST_AT_URI_REGEX } from "@/config/constants";

const postIdentifier = z.string().min(1, "Post URL or AT URI is required").refine(
  (val) => BSKY_POST_URL_REGEX.test(val) || BSKY_POST_AT_URI_REGEX.test(val.trim()),
  { message: "Must be a valid Bluesky post URL (bsky.app) or AT URI (at://...)" }
);

export const predictionSchema = z.object({
  tweet_url: postIdentifier,
  predicted_viral: z.boolean({ message: "Prediction choice is required" }),
  confidence: z.enum(["low", "normal", "high"]).optional().default("normal"),
});

export const leaderboardQuerySchema = z.object({
  timeframe: z.enum(["week", "month", "all"]).optional().default("all"),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

export type PredictionInput = z.infer<typeof predictionSchema>;
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
