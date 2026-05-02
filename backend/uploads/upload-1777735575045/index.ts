// ============================================================================
// TrendArena Bluesky Bot — entry point
// ============================================================================
import "dotenv/config";
import { createServer } from "node:http";
import { loginBot, resolveBotDid, postStandalone } from "./bluesky.js";
import { startJetstream } from "./jetstream.js";
import { startResolver } from "./resolver.js";
import { buildDailyAnnouncementText, getCurrentMode } from "./modes.js";

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
  const botHandle = (process.env.BSKY_HANDLE ?? "").replace(/^@/, "");
  const appUrl = process.env.APP_URL ?? "https://trendarena.vercel.app";
  console.log(`[bot] Authenticated as @${botHandle} (${botDid})`);

  // Log today's active mode
  const todayMode = getCurrentMode();
  console.log(`[bot] Today's mode: ${todayMode.emoji} ${todayMode.name}`);

  // Start background prediction resolver (runs every 5 minutes)
  startResolver();

  // Connect to Jetstream and listen for mentions in real time
  startJetstream(botDid);

  // Daily mode announcement at UTC midnight (±30 s window)
  startDailyAnnouncer(botHandle, appUrl);

  console.log("[bot] Bot is live — listening for mentions on Jetstream.");
}

/**
 * Checks every minute whether it's just past UTC midnight.
 * If so (and we haven't already announced today), posts the daily mode post.
 */
function startDailyAnnouncer(botHandle: string, appUrl: string): void {
  let lastAnnouncedDay = -1;

  const check = async () => {
    const now = new Date();
    const utcDay = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    // Post within the first 5 minutes of UTC midnight, once per day
    if (utcMinutes < 5 && utcDay !== lastAnnouncedDay) {
      lastAnnouncedDay = utcDay;
      try {
        const text = buildDailyAnnouncementText(botHandle, appUrl);
        await postStandalone(text);
        const mode = getCurrentMode();
        console.log(`[announcer] Posted daily mode: ${mode.emoji} ${mode.name}`);
      } catch (err: unknown) {
        console.error("[announcer] Failed to post daily announcement:", (err as Error).message);
      }
    }
  };

  // Check every 60 seconds
  setInterval(() => { check().catch(() => {}); }, 60_000);
  console.log("[announcer] Daily mode announcer started");
}

main().catch((err: unknown) => {
  console.error("[bot] Fatal startup error:", err);
  process.exit(1);
});
