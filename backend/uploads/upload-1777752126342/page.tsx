import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="flex flex-1 w-full max-w-5xl flex-col items-center gap-16 px-6 py-20">

        {/* Hero */}
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Glow orb behind logo */}
          <div className="relative">
            <div className="absolute inset-0 -z-10 blur-3xl opacity-40 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full scale-150" />
            <div className="flex items-center gap-4">
              <span className="text-6xl drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]">🔥</span>
              <h1 className="text-6xl font-black tracking-tight bg-gradient-to-r from-violet-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">
                TrendArena
              </h1>
            </div>
          </div>
          <p className="max-w-lg text-xl text-zinc-400 leading-relaxed">
            Predict which Bluesky posts go viral.{" "}
            <span className="text-violet-400">Earn points.</span> Climb the leaderboard.{" "}
            <span className="text-cyan-400">Prove your instincts.</span>
          </p>

          {/* Live mode badge */}
          <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-green-400">Bot Live on Bluesky • @vovalo.bsky.social</span>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { icon: "🎯", label: "Predict Virality", color: "border-violet-700/40 bg-violet-950/30 text-violet-300" },
            { icon: "🏆", label: "Global Leaderboards", color: "border-yellow-700/40 bg-yellow-950/30 text-yellow-300" },
            { icon: "🏅", label: "Unlock Badges", color: "border-cyan-700/40 bg-cyan-950/30 text-cyan-300" },
            { icon: "🔥", label: "Streak Bonuses", color: "border-orange-700/40 bg-orange-950/30 text-orange-300" },
            { icon: "🦋", label: "Play on Bluesky Bot", color: "border-sky-700/40 bg-sky-950/30 text-sky-300" },
          ].map((f) => (
            <span key={f.label} className={`rounded-full border px-4 py-2 text-sm font-medium ${f.color}`}>
              {f.icon} {f.label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-4 sm:flex-row">
          {user ? (
            <Link
              href="/dashboard"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:from-violet-500 hover:to-purple-500 transition-all"
            >
              Enter Arena →
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:from-violet-500 hover:to-purple-500 transition-all"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Enter Arena — Login
            </Link>
          )}
          <Link
            href="/leaderboard"
            className="flex h-12 items-center justify-center rounded-xl border border-purple-800/50 bg-purple-950/20 px-8 font-medium text-purple-300 hover:border-purple-600/60 hover:bg-purple-950/40 hover:text-purple-200 transition-all"
          >
            View Leaderboard
          </Link>
        </div>

        {/* How it works */}
        <div className="w-full">
          <h2 className="text-center text-xs font-bold uppercase tracking-widest text-zinc-500 mb-8">
            — How It Works —
          </h2>
          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: "🔮",
                title: "Pick a Post",
                desc: "Paste any Bluesky post URL. Or reply to a post on Bluesky and tag @vovalo.bsky.social.",
                color: "from-violet-500/20 to-transparent",
                border: "border-violet-800/40",
                glow: "shadow-[0_0_20px_rgba(139,92,246,0.1)]",
              },
              {
                step: "02",
                icon: "⚔️",
                title: "Call It",
                desc: 'Say "viral" if you think it explodes, "flop" if you think it dies. Lock it in.',
                color: "from-cyan-500/20 to-transparent",
                border: "border-cyan-800/40",
                glow: "shadow-[0_0_20px_rgba(6,182,212,0.1)]",
              },
              {
                step: "03",
                icon: "🏆",
                title: "Earn & Climb",
                desc: "Correct calls earn points. Build streaks. Unlock badges. Top the leaderboard.",
                color: "from-orange-500/20 to-transparent",
                border: "border-orange-800/40",
                glow: "shadow-[0_0_20px_rgba(249,115,22,0.1)]",
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`relative flex flex-col gap-4 rounded-2xl border ${item.border} bg-[#0d0d24] p-6 ${item.glow} overflow-hidden`}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b ${item.color} opacity-30`} />
                {/* Top line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />

                <div className="relative flex items-center gap-3">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="font-mono text-xs font-bold text-zinc-600">{item.step}</span>
                </div>
                <h3 className="relative text-lg font-bold text-white">{item.title}</h3>
                <p className="relative text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Game modes teaser */}
        <div className="w-full rounded-2xl border border-purple-800/30 bg-purple-950/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-1">Daily Rotating Game Modes</p>
              <div className="flex gap-4 text-sm">
                <span className="text-orange-400">🚀 Viral Verdict</span>
                <span className="text-cyan-400">🔁 Repost Rush</span>
                <span className="text-pink-400">💥 Engagement Bomb</span>
              </div>
            </div>
            <Link
              href="/leaderboard?source=bluesky"
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              See bot players →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-purple-900/20 py-6 text-center text-xs text-zinc-600">
        © 2026 TrendArena · Predict the future of social ·{" "}
        <span className="text-purple-600">Built on Bluesky</span>
      </footer>
    </div>
  );
}

