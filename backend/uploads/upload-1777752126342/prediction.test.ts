import { describe, it, expect } from "vitest";
import { predictionSchema } from "@/lib/validators/prediction";

describe("predictionSchema", () => {
  it("accepts a valid bsky.app URL with predicted_viral", () => {
    const result = predictionSchema.safeParse({
      tweet_url: "https://bsky.app/profile/alice.bsky.social/post/abc123",
      predicted_viral: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an AT URI", () => {
    const result = predictionSchema.safeParse({
      tweet_url: "at://did:plc:xxx/app.bsky.feed.post/abc123",
      predicted_viral: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a handle-based AT URI", () => {
    const result = predictionSchema.safeParse({
      tweet_url: "at://alice.bsky.social/app.bsky.feed.post/abc123",
      predicted_viral: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty tweet_url", () => {
    const result = predictionSchema.safeParse({
      tweet_url: "",
      predicted_viral: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing predicted_viral", () => {
    const result = predictionSchema.safeParse({
      tweet_url: "https://bsky.app/profile/alice.bsky.social/post/abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-Bluesky URLs", () => {
    const result = predictionSchema.safeParse({
      tweet_url: "https://twitter.com/user/status/123456",
      predicted_viral: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects random strings", () => {
    const result = predictionSchema.safeParse({
      tweet_url: "not-a-valid-input",
      predicted_viral: true,
    });
    expect(result.success).toBe(false);
  });

  it("defaults confidence to 'normal'", () => {
    const result = predictionSchema.safeParse({
      tweet_url: "https://bsky.app/profile/alice.bsky.social/post/abc123",
      predicted_viral: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.confidence).toBe("normal");
    }
  });

  it("accepts explicit confidence 'high'", () => {
    const result = predictionSchema.safeParse({
      tweet_url: "https://bsky.app/profile/alice.bsky.social/post/abc123",
      predicted_viral: true,
      confidence: "high",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.confidence).toBe("high");
    }
  });
});
