import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginButton } from "./login-button";

export const metadata = { title: "Login" };

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      {/* Glow backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-96 w-96 rounded-full bg-violet-700/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-6xl drop-shadow-[0_0_25px_rgba(249,115,22,0.7)]">🔥</span>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-violet-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
            TrendArena
          </h1>
          <p className="text-sm text-zinc-400 max-w-xs">
            Sign in to start predicting viral posts on Bluesky.
          </p>
        </div>

        {/* Login card */}
        <div className="relative w-full rounded-2xl border border-purple-800/40 bg-[#0d0d24] p-8 shadow-[0_0_40px_rgba(139,92,246,0.1)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent rounded-t-2xl" />
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col gap-2 text-center">
              <p className="text-sm font-bold text-zinc-300">Enter the Arena</p>
              <p className="text-xs text-zinc-600">No separate account needed — GitHub is your login</p>
            </div>
            <LoginButton />
          </div>
        </div>

        <p className="text-xs text-zinc-700 max-w-xs text-center">
          By signing in you agree to our Terms. We only access public post data.
        </p>
      </div>
    </div>
  );
}

 bg-clip-text text-transparent">
              {(profile?.display_name || profile?.username || "PLAYER")?.toUpperCase()}
            </span>
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">Ready to spot the next viral trend?</p>
        </div>
        <Link
          href="/predict"
          className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 font-bold text-sm text-white shadow-[0_0_15px_rgba(139,92,246,0.35)] hover:shadow-[0_0_20px_rgba(139,92,246,0.55)] hover:from-violet-500 hover:to-purple-500 transition-all"
        >
          + New Prediction
        </Link>
      </div>

      {/* XP Bar */}
      <div className="rounded-xl border border-purple-900/30 bg-purple-950/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Level {level} Progress</span>
          <span className="text-xs text-zinc-500 font-mono">{xpProgress} / 100 XP</span>
        </div>
        <div className="h-2 rounded-full bg-purple-950/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.6)] transition-all duration-700"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`relative flex flex-col gap-2 rounded-xl border ${stat.border} bg-[#0d0d24] p-5 transition-all ${stat.glow} overflow-hidden group`}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />
            <span className="text-2xl">{stat.icon}</span>
            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Share */}
      <div className="flex gap-3">
        <ShareButton type="profile" accuracy={accuracy} />
      </div>

      {/* Recent predictions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">⚔️ Recent Predictions</h2>
          <Link href="/predict" className="text-xs font-bold text-violet-400 hover:text-violet-300 uppercase tracking-wider transition-colors">
            View all →
          </Link>
        </div>
        {recentPredictions && recentPredictions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentPredictions.map((pred: any) => (
              <div
                key={pred.id}
                className="flex items-center justify-between rounded-xl border border-purple-900/20 bg-[#0d0d24] p-4 hover:border-purple-800/30 transition-all"
              >
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 truncate">
                    {pred.tweets?.text || `Post ${pred.tweet_id}`}
                  </p>
                  <div className="flex gap-2 text-xs text-zinc-600">
                    <span>{pred.predicted_viral ? "🚀 Viral" : "💤 Flop"}</span>
                    <span>·</span>
                    <span>{new Date(pred.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span
                  className={`ml-4 shrink-0 rounded-lg px-3 py-1 text-xs font-bold ${
                    pred.status === "pending"
                      ? "bg-yellow-500/10 text-yellow-400 border border-yellow-800/30"
                      : pred.is_correct
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-800/30"
                        : "bg-red-500/10 text-red-400 border border-red-800/30"
                  }`}
                >
                  {pred.status === "pending" ? "⏳ PENDING" : pred.is_correct ? `✅ +${pred.points_awarded}` : "❌ WRONG"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-purple-900/30 py-12 text-center">
            <span className="text-4xl">🔮</span>
            <p className="text-zinc-500">No predictions yet. Make your first call!</p>
            <Link href="/predict" className="rounded-xl border border-violet-700/40 bg-violet-950/20 px-6 py-2 text-sm font-bold text-violet-300 hover:bg-violet-950/40 transition-all">
              Make a prediction
            </Link>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { href: "/leaderboard", icon: "🏆", title: "Leaderboard", desc: "See how you rank globally", border: "border-yellow-800/30 hover:border-yellow-700/50", bg: "hover:bg-yellow-950/10" },
          { href: "/profile",     icon: "🏅", title: "Your Profile", desc: "Badges, stats & history",  border: "border-purple-800/30 hover:border-purple-700/50", bg: "hover:bg-purple-950/20" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-4 rounded-2xl border ${link.border} bg-[#0d0d24] p-5 transition-all ${link.bg}`}
          >
            <span className="text-3xl">{link.icon}</span>
            <div>
              <h3 className="font-bold text-white">{link.title}</h3>
              <p className="text-sm text-zinc-500">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

iv>
      )}
    </div>
  );
}

pred.is_correct ? `✅ +${pred.points_awarded}` : "❌ WRONG"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

 Date(pred.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span
                  className={`ml-3 shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                    pred.status === "pending"
                      ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                      : pred.is_correct
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-red-500/20 bg-red-500/10 text-red-400"
                  }`}
                >
                  {pred.status === "pending"
                    ? "⏳ Pending"
                    : pred.is_correct
                      ? `✅ +${pred.points_awarded}`
                      : "❌ Wrong"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-600 text-sm">No predictions yet.</p>
        )}
      </div>

      {/* Bluesky account claiming */}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase text-violet-400 mb-3">🦋 Bluesky Account</p>
        <BlueskyClaimSection currentHandle={(profile as any).bluesky_handle ?? null} />
      </div>
    </div>
  );
}
