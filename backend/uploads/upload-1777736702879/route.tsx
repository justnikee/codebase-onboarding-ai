import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") || "default";
  const username = searchParams.get("username");
  const points = searchParams.get("points");
  const rank = searchParams.get("rank");
  const accuracy = searchParams.get("accuracy");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          fontFamily: "sans-serif",
        }}
      >
        {/* Gradient accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(to right, #f97316, #ec4899)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <span style={{ fontSize: "56px" }}>🔥</span>
          <span
            style={{
              fontSize: "56px",
              fontWeight: 700,
              background: "linear-gradient(to right, #f97316, #ec4899)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            TrendArena
          </span>
        </div>

        {/* Type label */}
        <div
          style={{
            fontSize: "20px",
            color: "#a1a1aa",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          {type === "leaderboard"
            ? "Leaderboard"
            : type === "profile"
              ? "Player Profile"
              : type === "prediction"
                ? "Prediction"
                : ""}
        </div>

        {/* Username */}
        {username && (
          <div
            style={{
              fontSize: "32px",
              color: "#e4e4e7",
              marginBottom: "24px",
              fontWeight: 600,
            }}
          >
            @{username}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: "48px" }}>
          {points && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: "48px", fontWeight: 700, color: "#f97316" }}
              >
                {points}
              </span>
              <span style={{ fontSize: "18px", color: "#71717a" }}>Points</span>
            </div>
          )}
          {rank && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: "48px", fontWeight: 700, color: "#ec4899" }}
              >
                #{rank}
              </span>
              <span style={{ fontSize: "18px", color: "#71717a" }}>Rank</span>
            </div>
          )}
          {accuracy && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: "48px", fontWeight: 700, color: "#22c55e" }}
              >
                {accuracy}%
              </span>
              <span style={{ fontSize: "18px", color: "#71717a" }}>
                Accuracy
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
