"use client";

type ShareType = "prediction" | "leaderboard" | "badge" | "profile";

interface ShareButtonProps {
  type: ShareType;
  points?: number;
  rank?: number;
  badgeName?: string;
  accuracy?: number;
}

function getShareText(props: ShareButtonProps): string {
  switch (props.type) {
    case "prediction":
      return "I just predicted a Bluesky post would go viral on @TrendArena! 🔮";
    case "leaderboard":
      return props.points
        ? `I'm ranked #${props.rank} with ${props.points} points on @TrendArena! 🏆`
        : `I'm ranked #${props.rank} on @TrendArena! 🏆`;
    case "badge":
      return `I just earned the '${props.badgeName}' badge on @TrendArena! 🏅`;
    case "profile":
      return `Check out my predictions on @TrendArena! ${props.accuracy}% accuracy 🎯`;
  }
}

export function ShareButton(props: ShareButtonProps) {
  const text = getShareText(props);
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=TrendArena`;

  const handleClick = () => {
    window.open(url, "_blank", "width=550,height=420");
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 fill-current"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Share
    </button>
  );
}
