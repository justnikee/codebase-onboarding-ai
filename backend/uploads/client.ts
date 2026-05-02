import { BskyAgent } from "@atproto/api";
import { BSKY_API_BASE, BSKY_POST_URL_REGEX } from "@/config/constants";

const agent = new BskyAgent({ service: BSKY_API_BASE.replace("/xrpc", "") });

export interface PostMetrics {
  like_count: number;
  repost_count: number;
  reply_count: number;
  quote_count: number;
}

export interface FetchedPost {
  uri: string;
  cid: string;
  text: string;
  author_did: string;
  author_handle: string;
  metrics: PostMetrics;
  created_at: string | undefined;
}

function mapPostView(post: any): FetchedPost {
  return {
    uri: post.uri,
    cid: post.cid,
    text: (post.record as any)?.text ?? "",
    author_did: post.author?.did ?? "",
    author_handle: post.author?.handle ?? "",
    metrics: {
      like_count: post.likeCount ?? 0,
      repost_count: post.repostCount ?? 0,
      reply_count: post.replyCount ?? 0,
      quote_count: post.quoteCount ?? 0,
    },
    created_at: (post.record as any)?.createdAt,
  };
}

/** Extract AT URI from bsky.app URL or pass through if already AT URI. */
export function extractPostUri(input: string): string | null {
  if (!input) return null;
  if (input.startsWith("at://")) return input;
  const match = input.match(BSKY_POST_URL_REGEX);
  if (match) {
    const [, handle, rkey] = match;
    return `at://${handle}/app.bsky.feed.post/${rkey}`;
  }
  return null;
}

/** Fetch a single post by AT URI or bsky.app URL. */
export async function fetchPost(uriOrUrl: string): Promise<FetchedPost | null> {
  const uri = extractPostUri(uriOrUrl);
  if (!uri) return null;
  try {
    const res = await agent.getPostThread({ uri, depth: 0 });
    const thread = res.data.thread;
    if (!thread || !("post" in thread)) return null;
    return mapPostView((thread as any).post);
  } catch (err: any) {
    if (err?.status === 404 || err?.error === "NotFound") return null;
    throw err;
  }
}

/** Fetch multiple posts by AT URI (max 25 per call). */
export async function fetchPosts(uris: string[]): Promise<FetchedPost[]> {
  if (uris.length === 0) return [];
  const results: FetchedPost[] = [];
  // Bluesky getPosts accepts max 25 at a time
  for (let i = 0; i < uris.length; i += 25) {
    const batch = uris.slice(i, i + 25);
    try {
      const res = await agent.getPosts({ uris: batch });
      for (const post of res.data.posts) {
        results.push(mapPostView(post));
      }
    } catch {
      // Skip failed batches rather than aborting entire operation
    }
  }
  return results;
}

/** Search recent posts. */
export async function searchPosts(query: string, limit = 25): Promise<FetchedPost[]> {
  try {
    const res = await agent.app.bsky.feed.searchPosts({ q: query, limit });
    return res.data.posts.map(mapPostView);
  } catch {
    return [];
  }
}
