// Quick smoke test — posts a real mention on Bluesky and runs it through the handler.
// Run: npx tsx test-mention.ts
import "dotenv/config";
import { loginBot, resolveBotDid, agent } from "./src/bluesky.js";
import { handleMention } from "./src/handler.js";

await loginBot();
const botDid = await resolveBotDid();
console.log(`✅ Logged in as @${process.env.BSKY_HANDLE} (${botDid})\n`);

// Step 1: grab a real post from the timeline to predict on
console.log("🔍 Finding a real post to predict on...");
const timeline = await agent.getTimeline({ limit: 10 });
const target = timeline.data.feed.find((f) => f.post.uri.includes("app.bsky.feed.post"))?.post;

if (!target) {
  console.error("❌ No posts in timeline. Follow some accounts on the bot's Bluesky account first.");
  process.exit(1);
}
console.log(`📌 Target post: ${target.uri}`);
console.log(`   Likes: ${(target as any).likeCount ?? 0}\n`);

// Step 2: post a real reply to that post (this is the simulated "user mention")
console.log(`📝 Posting a real mention reply as @${process.env.BSKY_HANDLE}...`);
const mention = await agent.post({
  text: `@${process.env.BSKY_HANDLE} viral`,
  reply: {
    root:   { uri: target.uri, cid: target.cid },
    parent: { uri: target.uri, cid: target.cid },
  },
});
console.log(`✅ Mention posted: ${mention.uri}\n`);

// Step 3: pass the real event to the handler
const fakeEvent = {
  did: botDid,
  rkey: mention.uri.split("/").pop()!,
  cid: mention.cid,
  uri: mention.uri,
  record: {
    $type: "app.bsky.feed.post" as const,
    text: `@${process.env.BSKY_HANDLE} viral`,
    facets: [
      {
        index: { byteStart: 0, byteEnd: process.env.BSKY_HANDLE!.length + 1 },
        features: [{ $type: "app.bsky.richtext.facet#mention", did: botDid }],
      },
    ],
    reply: {
      root:   { uri: target.uri, cid: target.cid },
      parent: { uri: target.uri, cid: target.cid },
    },
    createdAt: new Date().toISOString(),
  },
};

console.log("🤖 Running handleMention...\n");
await handleMention(fakeEvent);
console.log("\n✅ Done — check your Bluesky notifications for the bot's confirmation reply.");
