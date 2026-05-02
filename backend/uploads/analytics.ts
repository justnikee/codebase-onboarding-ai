import { createAdminClient } from "@/lib/supabase/admin";

export async function getDailyActiveUsers(date?: Date): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(
    (date ?? new Date()).getTime() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { count, error } = await admin
    .from("events")
    .select("user_id", { count: "exact", head: true })
    .not("user_id", "is", null)
    .gte("created_at", since);

  if (error) {
    console.error("[analytics] getDailyActiveUsers error:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getPredictionsPerDay(
  days: number = 30
): Promise<{ date: string; count: number }[]> {
  const admin = createAdminClient();
  const since = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await admin
    .from("events")
    .select("created_at")
    .eq("type", "prediction_submitted")
    .gte("created_at", since);

  if (error) {
    console.error("[analytics] getPredictionsPerDay error:", error.message);
    return [];
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getAccuracyRate(): Promise<number> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("events")
    .select("payload")
    .eq("type", "prediction_resolved");

  if (error || !data || data.length === 0) {
    if (error) console.error("[analytics] getAccuracyRate error:", error.message);
    return 0;
  }

  let correct = 0;
  for (const row of data) {
    const payload = row.payload as Record<string, unknown> | null;
    if (payload && payload.is_correct === true) correct++;
  }

  return Math.round((correct / data.length) * 10000) / 100;
}

export async function getTopEventTypes(
  limit: number = 10
): Promise<{ type: string; count: number }[]> {
  const admin = createAdminClient();

  const { data, error } = await admin.from("events").select("type");

  if (error) {
    console.error("[analytics] getTopEventTypes error:", error.message);
    return [];
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.type, (counts.get(row.type) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
