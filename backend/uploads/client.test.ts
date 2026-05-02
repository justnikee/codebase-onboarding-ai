import { describe, it, expect } from "vitest";
import { extractPostUri } from "../client";

describe("extractPostUri", () => {
  it("converts bsky.app URL to AT URI", () => {
    expect(
      extractPostUri("https://bsky.app/profile/alice.bsky.social/post/abc123"),
    ).toBe("at://alice.bsky.social/app.bsky.feed.post/abc123");
  });

  it("passes through an existing AT URI unchanged", () => {
    expect(
      extractPostUri("at://did:plc:xxx/app.bsky.feed.post/abc123"),
    ).toBe("at://did:plc:xxx/app.bsky.feed.post/abc123");
  });

  it("returns null for an unrecognised URL", () => {
    expect(extractPostUri("https://google.com")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(extractPostUri("")).toBeNull();
  });
});
