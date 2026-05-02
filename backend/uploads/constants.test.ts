import { describe, it, expect } from "vitest";
import {
  POINTS_CORRECT,
  MAX_PREDICTIONS_PER_MINUTE,
  BSKY_POST_URL_REGEX,
  PREDICTION_RESOLVE_WINDOW_MINUTES,
} from "@/config/constants";

describe("constants", () => {
  it("POINTS_CORRECT is a positive number", () => {
    expect(POINTS_CORRECT).toBeGreaterThan(0);
    expect(typeof POINTS_CORRECT).toBe("number");
  });

  it("MAX_PREDICTIONS_PER_MINUTE is greater than 0", () => {
    expect(MAX_PREDICTIONS_PER_MINUTE).toBeGreaterThan(0);
  });

  it("BSKY_POST_URL_REGEX is a valid RegExp that matches bsky.app URLs", () => {
    expect(BSKY_POST_URL_REGEX).toBeInstanceOf(RegExp);
    expect(BSKY_POST_URL_REGEX.test("bsky.app/profile/alice.bsky.social/post/abc123")).toBe(true);
    expect(BSKY_POST_URL_REGEX.test("https://bsky.app/profile/user/post/xyz789")).toBe(true);
    expect(BSKY_POST_URL_REGEX.test("google.com/search")).toBe(false);
  });

  it("PREDICTION_RESOLVE_WINDOW_MINUTES is 60", () => {
    expect(PREDICTION_RESOLVE_WINDOW_MINUTES).toBe(60);
  });
});
