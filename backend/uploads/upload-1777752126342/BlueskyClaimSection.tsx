"use client";

import { useState } from "react";

type Step = "idle" | "pending" | "verifying" | "success" | "error";

interface Props {
  currentHandle?: string | null;
}

export function BlueskyClaimSection({ currentHandle }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [handle, setHandle] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [mergedPoints, setMergedPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  if (currentHandle) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
        <span className="text-xl">🦋</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Bluesky Connected</p>
          <p className="text-xs text-sky-400">@{currentHandle}</p>
        </div>
        <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs text-sky-400">
          ✓ Linked
        </span>
      </div>
    );
  }

  async function initiate() {
    const h = handle.trim().replace(/^@/, "");
    if (!h || !h.includes(".")) {
      setError("Enter a valid handle like yourname.bsky.social");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/claim/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: h }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate code");
      setToken(data.token);
      setHandle(data.handle);
      setStep("pending");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/claim/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      setMergedPoints(data.merged_points ?? 0);
      setStep("success");
    } catch (e: any) {
      setError(e.message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  const bskyPostUrl = token
    ? `https://bsky.app/intent/compose?text=${encodeURIComponent(token)}`
    : "#";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🦋</span>
        <h3 className="font-semibold text-white">Connect Bluesky Account</h3>
      </div>
      <p className="text-sm text-zinc-400">
        Link your Bluesky identity to merge your bot predictions and points into
        this account.
      </p>

      {step === "idle" && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="yourname.bsky.social"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && initiate()}
            />
            <button
              onClick={initiate}
              disabled={loading}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
            >
              {loading ? "..." : "Generate code"}
            </button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}

      {step === "pending" && (
        <div className="flex flex-col gap-4">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="rounded-full bg-sky-600 px-2 py-0.5 text-white">1</span>
            <span className="text-zinc-400">Handle entered</span>
            <span className="mx-1">→</span>
            <span className="rounded-full bg-sky-600 px-2 py-0.5 text-white">2</span>
            <span className="text-sky-400 font-medium">Post on Bluesky</span>
            <span className="mx-1">→</span>
            <span className="rounded-full bg-zinc-700 px-2 py-0.5">3</span>
            <span>Verify</span>
          </div>

          <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 flex flex-col gap-3">
            <p className="text-sm text-zinc-300">
              Post this exact text from{" "}
              <span className="text-sky-400 font-mono">@{handle}</span> on Bluesky:
            </p>
            <div className="flex items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3">
              <code className="flex-1 font-mono text-sm text-yellow-300 break-all">
                {token}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(token)}
                className="shrink-0 text-zinc-400 hover:text-white text-xs"
                title="Copy"
              >
                📋
              </button>
            </div>
            <a
              href={bskyPostUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-sky-600 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
            >
              🦋 Open Bluesky to post
            </a>
          </div>

          <p className="text-xs text-zinc-500">
            The post can be deleted afterwards. You have 2 hours to verify.
          </p>

          <div className="flex gap-2">
            <button
              onClick={verify}
              disabled={loading}
              className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
            >
              {loading ? "Checking Bluesky…" : "✅ I posted it — verify!"}
            </button>
            <button
              onClick={() => { setStep("idle"); setError(""); }}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
            >
              Back
            </button>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}

      {step === "error" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => { setStep("pending"); setError(""); }}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 self-start"
          >
            ← Try again
          </button>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-5 text-center">
          <span className="text-3xl">🎉</span>
          <p className="font-semibold text-white">
            @{handle} linked successfully!
          </p>
          {mergedPoints > 0 && (
            <p className="text-sm text-green-400">
              +{mergedPoints.toLocaleString()} points merged from your bot
              predictions!
            </p>
          )}
          <p className="text-xs text-zinc-500">
            Refresh the page to see your updated profile.
          </p>
        </div>
      )}
    </div>
  );
}
