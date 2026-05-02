# TrendArena "BlueSky Edition" (Zero-Budget Pivot)

This plan outlines the complete transition from a $200/month deficit (Twitter) to a **$0/month operational cost** using the open AT Protocol (Bluesky).

## 🏗️ Phase 1: The "Arena Bot" Infrastructure
The bot is your engine. On Bluesky, bots are highly visible and don't require expensive API keys.

### 1.1 Database Evolution (Supabase)
We'll update your current schema to handle multiple platforms and "Shadow Profiles."

**profiles table:**
- Add `bluesky_did` (Unique TEXT, Nullable)
- Make `twitter_id` Nullable.
- Add `points_pending` (Integer, default 0) — For users who tag the bot but haven't signed up yet.

**arena_posts table (formerly tweets):**
- Add `platform` (Enum: 'bluesky', 'twitter').
- Add `uri` and `cid` (Bluesky-specific identifiers for posts).

**arena_configs table:**
- Add `current_mode` (Enum: 'viral', 'sentiment').
- Add `rotation_timestamp` (To track when to swap modes).

### 1.2 The "Broke Dev" Tech Stack
- **Language:** TypeScript / Node.js.
- **API Library:** `@atproto/api` (The official Bluesky library).
- **Real-time Listener:** Use **Jetstream**. It’s a free, high-speed "firehose" that lets you filter for mentions of `@trendarena.bsky.social` instantly without polling.

## 🎮 Phase 2: The Two-Mode Rotation
We will rotate these every 24 hours to keep engagement high.

### Mode A: Viral Predictor (Mon/Wed/Fri/Sun)
- **The Goal:** Predict if a post hits a "Like" milestone in 60 minutes.
- **The Logic:**
  1. User tags bot: `@trendarena viral`.
  2. Bot fetches current likeCount via `app.bsky.feed.getPostThread`.
  3. 60 minutes later, bot fetches again.
  4. **Victory:** If likes grew by >50% (or a set target), user wins points.

### Mode B: Sentiment Sniper (Tue/Thu/Sat)
- **The Goal:** Predict the "vibe" of the replies to a trending post.
- **The Logic:**
  1. Bot identifies a high-engagement post.
  2. Users reply: `@trendarena sentiment negative`.
  3. After 60 mins, bot fetches all replies.
  4. **Free AI Processing:** Use an open-source library like `vader-sentiment` or `transformers.js`. These run locally on your server so you don't pay for OpenAI calls.
  5. Bot settles the "bet" based on the average sentiment score.

## 🎤 Phase 3: The Voice & Text Integration
We'll use the browser's native powers to save on recording/AI costs.

### 3.1 Voice Input (Web Speech API)
On the TrendArena website, use the browser's built-in microphone listener.
- **How it works:** When a user holds the "Speak Prediction" button, the browser converts their speech to text on their device.
- **Result:** You get the text string for free, saving on server storage/bandwidth.

### 3.2 The "Arena Announcer" (Speech Synthesis)
When a user visits the leaderboard or a post "resolves," have the site announce it.
- **The Code:** `window.speechSynthesis.speak(new SpeechSynthesisUtterance("New Viral Champion: @user.bsky.social!"));`
- **Style:** Pick high-energy system voices to give the "Arena" a sports-radio feel.

## 📈 Phase 4: Growth & Monetization (The "Free" Way)
- **The "Settle" Post:** Every 60 minutes, the bot posts a public reply: 
  *"🎰 Arena Result! @winner.bsky.social was right. This post went viral! 🚀 +500 pts. View the Arena: [trendarena.app]"*
- **Starter Packs:** Create a Bluesky "Starter Pack" called "TrendArena Top Players." 
- **Domain as Handle:** Change your bot's handle to `@bot.trendarena.app`. This is a free way to "verify" your brand on Bluesky and looks professional.
