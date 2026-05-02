/**
 * Database service – thin wrapper around Supabase for all persistence operations.
 * Every function gracefully returns null/false/[] when the DB is not configured.
 */

import { supabase } from "../lib/supabase.js";

export interface DbUser {
  id: string;
  github_id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
}

export interface DbAnalysis {
  id: string;
  user_id: string;
  repo_url: string;
  repo_full_name: string | null;
  context_id: string;
  status: string;
  summary_snapshot: string | null;
  readiness_score: number | null;
  created_at: string;
  completed_at: string | null;
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(params: {
  githubId: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}): Promise<DbUser | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        github_id: params.githubId,
        email: params.email ?? null,
        name: params.name ?? null,
        avatar_url: params.avatarUrl ?? null,
        last_login_at: new Date().toISOString(),
      },
      { onConflict: "github_id" },
    )
    .select("id, github_id, email, name, avatar_url")
    .single();

  if (error) {
    console.error("[db] upsertUser error:", error.message);
    return null;
  }
  return data as DbUser;
}

// ── Analyses ─────────────────────────────────────────────────────────────────

export async function saveAnalysis(params: {
  userId: string;
  repoUrl: string;
  repoFullName?: string | null;
  contextId: string;
  summarySnapshot?: string | null;
  readinessScore?: number | null;
}): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("analyses")
    .upsert(
      {
        user_id: params.userId,
        repo_url: params.repoUrl,
        repo_full_name: params.repoFullName ?? null,
        context_id: params.contextId,
        status: "completed",
        summary_snapshot: params.summarySnapshot ?? null,
        readiness_score: params.readinessScore ?? null,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "context_id" },
    )
    .select("id")
    .single();

  if (error) {
    console.error("[db] saveAnalysis error:", error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function getAnalysisIdByContextId(
  contextId: string,
): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("analyses")
    .select("id")
    .eq("context_id", contextId)
    .maybeSingle();

  if (error) return null;
  return data?.id ?? null;
}

export async function getUserHistory(userId: string): Promise<DbAnalysis[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("analyses")
    .select(
      "id, user_id, repo_url, repo_full_name, context_id, status, summary_snapshot, readiness_score, created_at, completed_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[db] getUserHistory error:", error.message);
    return [];
  }
  return (data ?? []) as DbAnalysis[];
}

// ── Chat messages ─────────────────────────────────────────────────────────────

export async function saveChatMessage(params: {
  analysisId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  relevantFiles?: string[];
  confidence?: string | null;
}): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      analysis_id: params.analysisId,
      user_id: params.userId,
      role: params.role,
      content: params.content,
      relevant_files: params.relevantFiles ?? [],
      confidence: params.confidence ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[db] saveChatMessage error:", error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function getChatHistory(analysisId: string): Promise<any[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, relevant_files, confidence, created_at")
    .eq("analysis_id", analysisId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[db] getChatHistory error:", error.message);
    return [];
  }
  return data ?? [];
}

// ── Feedback ─────────────────────────────────────────────────────────────────

export async function saveFeedback(params: {
  userId: string;
  analysisId?: string | null;
  messageId?: string | null;
  rating?: number | null;
  helpful?: boolean | null;
  comment?: string | null;
}): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from("feedback").insert({
    user_id: params.userId,
    analysis_id: params.analysisId ?? null,
    message_id: params.messageId ?? null,
    rating: params.rating ?? null,
    helpful: params.helpful ?? null,
    comment: params.comment ?? null,
  });

  if (error) {
    console.error("[db] saveFeedback error:", error.message);
    return false;
  }
  return true;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function trackEvent(params: {
  userId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("analytics_events").insert({
    user_id: params.userId ?? null,
    event_type: params.eventType,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.error("[db] trackEvent error:", error.message);
  }
}
