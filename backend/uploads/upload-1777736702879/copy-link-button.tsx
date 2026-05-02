"use client";

import { useState } from "react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
    >
      {copied ? "✓ Copied!" : "🔗 Copy Link"}
    </button>
  );
}
