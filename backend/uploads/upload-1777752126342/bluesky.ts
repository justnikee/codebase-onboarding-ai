// ============================================================================
// Bluesky authenticated agent + helpers
// ============================================================================
import { BskyAgent } from "@atproto/api";

export const agent = new BskyAgent({ service: "https://bsky.social" });

export async function loginBot(): Promise<void> {
  const handle = process.env.BSKY_HANDLE;
  const password = process.env.BSKY_APP_PASSWORD;
  if (!handle || !password) {
    throw new Error(
      "BSKY_HANDLE and BSKY_APP_PASSWORD environment variables are required"
    );
  }
  await agent.login({ identifier: handle, password });
}

export async function resolveBotDid(): Promise<string> {
  const res = await agent.resolveHandle({ handle: process.env.BSKY_HANDLE! });
  return res.data.did;
}

/** Resolve a Bluesky handle from a DID (one API call). */
export async function resolveHandleFromDid(did: string): Promise<string> {
  try {
    const res = await agent.getProfile({ actor: did });
    return res.data.handle;
  } catch {
    return did; // fall back to DID string if profile lookup fails
  }
}

export interface ReplyRef {
  uri: string;
  cid: string;
}

export interface PostMetrics {
  like_count: number;
  repost_count: number;
  reply_count: number;
}

/**
 * Post a reply in a Bluesky thread.
 * Returns the { uri, cid } of the new post.
 */
export async function postReply(
  text: string,
  parent: ReplyRef,
  root: ReplyRef
): Promise<ReplyRef> {
  const res = await agent.post({ text, reply: { root, parent } });
  return { uri: res.uri, cid: res.cid };
}

/** Fetch the current engagement metrics of a post by AT URI. */
export async function fetchPostMetrics(
  uri: string
): Promise<(PostMetrics & ReplyRef) | null> {
  try {
    const res = await agent.getPostThread({ uri, depth: 0 });
    const thread = res.data.thread;
    if (!thread || !("post" in thread)) return null;
    const post = (thread as any).post;
    return {
      uri: post.uri as string,
      cid: post.cid as string,
      like_count: post.likeCount ?? 0,
      repost_count: post.repostCount ?? 0,
      reply_count: post.replyCount ?? 0,
    };
  } catch {
    return null;
  }
}
