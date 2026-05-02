// ============================================================================
// TrendArena Bluesky Bot — entry point
// ============================================================================
import "dotenv/config";
import { createServer } from "node:http";
import { loginBot, resolveBotDid } from "./bluesky.js";
import { startJetstream } from "./jetstream.js";
import { startResolver } from "./resolver.js";

// Render (and most PaaS) require a bound HTTP port to consider the service
// "healthy". This minimal server also lets UptimeRobot ping it to prevent
// the free-tier instance from sleeping.
function startHealthServer(): void {
  const port = process.env.PORT ?? 3000;
  createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", bot: process.env.BSKY_HANDLE }));
  }).listen(port, () => {
    console.log(`[health] Listening on port ${port}`);
  });
}

async function main(): Promise<void> {
  console.log("[bot] Starting TrendArena Bluesky Bot...");

  // Health check HTTP server (required by Render free tier)
  startHealthServer();

  // Authenticate with Bluesky
  await loginBot();
  const botDid = await resolveBotDid();
  console.log(`[bot] Authenticated as @${process.env.BSKY_HANDLE} (${botDid})`);

  // Start background prediction resolver (runs every 5 minutes)
  startResolver();

  // Connect to Jetstream and listen for mentions in real time
  startJetstream(botDid);

  console.log("[bot] Bot is live — listening for mentions on Jetstream.");
}

main().catch((err: unknown) => {
  console.error("[bot] Fatal startup error:", err);
  process.exit(1);
});
