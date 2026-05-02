"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  PredictionRequest,
  PredictionResponse,
  PredictionWithTweet,
  LeaderboardResponse,
} from "@/types";

// ─── Predictions ────────────────────────────────────────────────────

export function usePredictions(status?: string) {
  return useQuery<{ predictions: PredictionWithTweet[]; total: number }>({
    queryKey: ["predictions", status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/predictions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch predictions");
      return res.json();
    },
  });
}

export function useSubmitPrediction() {
  const queryClient = useQueryClient();

  return useMutation<PredictionResponse, Error, PredictionRequest>({
    mutationFn: async (input) => {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit prediction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
    },
  });
}

// ─── Leaderboard ────────────────────────────────────────────────────

export function useLeaderboard(timeframe: "week" | "month" | "all" = "all") {
  return useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard", timeframe],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?timeframe=${timeframe}`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ─── Profile ────────────────────────────────────────────────────────

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await fetch(`/api/profile/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });
}

// ─── Notifications ──────────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}
