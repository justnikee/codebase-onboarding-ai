// ============================================================================
// Jetstream WebSocket listener
//
// Connects to the Bluesky Jetstream firehose and filters for posts that
// mention the bot. Reconnects automatically with exponential backoff.
// ============================================================================
import WebSocket from "ws";
import { handleMention } from "./handler.js";

const JETSTREAM_URL =
  "wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post";

const MAX_BACKOFF_MS = 60_000;
const DEDUP_TTL_MS = 5 * 60_000;

// Deduplicate events in case of brief reconnects
const recentlyProcessed = new Map<string, number>();

function pruneDedup(): void {
  const cutoff = Date.now() - DEDUP_TTL_MS;
  for (const [key, ts] of recentlyProcessed) {
    if (ts < cutoff) recentlyProcessed.delete(key);
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface JetstreamFacetFeature {
  $type: string;
  did?: string;
  uri?: string;
  tag?: string;
}

export interface JetstreamFacet {
  index: { byteStart: number; byteEnd: number };
  features: JetstreamFacetFeature[];
}

export interface JetstreamPostRecord {
  $type: "app.bsky.feed.post";
  text: string;
  facets?: JetstreamFacet[];
  reply?: {
    root: { uri: string; cid: string };
    parent: { uri: string; cid: string };
  };
  createdAt: string;
}

export interface JetstreamPost {
  did: string;  // author DID
  rkey: string; // record key
  cid: string;  // post CID (from commit)
  uri: string;  // at://did/app.bsky.feed.post/rkey
  record: JetstreamPostRecord;
}

// ── Parser ─────────────────────────────────────────────────────────────────

function extractMention(raw: string, botDid: string): JetstreamPost | null {
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return null;
  }

  if (
    event.kind !== "commit" ||
    event.commit?.operation !== "create" ||
    event.commit?.collection !== "app.bsky.feed.post"
  ) {
    return null;
  }

  const record: JetstreamPostRecord | undefined = event.commit?.record;
  if (!record?.facets) return null;

  const mentionsBot = record.facets.some((facet) =>
    facet.features?.some(
      (f) => f.$type === "app.bsky.richtext.facet#mention" && f.did === botDid
    )
  );
  if (!mentionsBot) return null;

  const did: string = event.did;
  const rkey: string = event.commit.rkey;
  const cid: string = event.commit.cid;

  return { did, rkey, cid, uri: `at://${did}/app.bsky.feed.post/${rkey}`, record };
}

// ── Connection ─────────────────────────────────────────────────────────────

export function startJetstream(botDid: string): void {
  let backoffMs = 1_000;

  function connect(): void {
    console.log("[jetstream] Connecting...");
    const ws = new WebSocket(JETSTREAM_URL);

    ws.on("open", () => {
      console.log("[jetstream] Connected.");
      backoffMs = 1_000; // reset on successful connect
    });

    ws.on("message", (data: Buffer) => {
      const post = extractMention(data.toString("utf8"), botDid);
      if (!post) return;

      const key = `${post.did}/${post.rkey}`;
      if (recentlyProcessed.has(key)) return;
      recentlyProcessed.set(key, Date.now());
      pruneDedup();

      // Fire-and-forget; errors are caught and logged inside handleMention
      handleMention(post).catch((err: unknown) =>
        console.error(`[jetstream] Unhandled error for ${key}:`, err)
      );
    });

    ws.on("error", (err: Error) =>
      console.error("[jetstream] WebSocket error:", err.message)
    );

    ws.on("close", () => {
      console.log(`[jetstream] Disconnected. Reconnecting in ${backoffMs}ms...`);
      setTimeout(() => {
        backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
        connect();
      }, backoffMs);
    });
  }

  connect();
}
