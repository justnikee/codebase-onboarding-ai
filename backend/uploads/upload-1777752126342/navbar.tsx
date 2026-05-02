import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url, points, level")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-purple-900/30 bg-[#070714]/90 backdrop-blur-md px-6 py-3">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <span className="text-xl">🔥</span>
        <span className="text-lg font-extrabold tracking-wide bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-violet-300 group-hover:to-cyan-300 transition-all">
          TrendArena
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        <Link
          href="/leaderboard"
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-violet-300 hover:bg-violet-950/40 transition-all"
        >
          🏆 Leaderboard
        </Link>

        {user ? (
          <>
            <Link
              href="/predict"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-all"
            >
              🔮 Predict
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-all"
            >
              Dashboard
            </Link>

            {/* Player HUD */}
            <Link
              href="/profile"
              className="flex items-center gap-2 ml-2 rounded-xl border border-purple-800/40 bg-purple-950/30 px-3 py-1.5 hover:border-purple-600/50 hover:bg-purple-950/50 transition-all group"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full ring-1 ring-purple-500/50" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-800/60 text-xs font-bold text-purple-300">
                  {profile?.username?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <span className="text-xs font-bold text-yellow-400">
                ⚡{profile?.points ?? 0}
              </span>
              <span className="text-xs text-purple-400 hidden sm:inline">
                LV{profile?.level ?? 1}
              </span>
            </Link>
          </>
        ) : (
          <Link
            href="/auth/login"
            className="ml-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white hover:from-violet-500 hover:to-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all"
          >
            Enter Arena →
          </Link>
        )}
      </div>
    </nav>
  );
}

