import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getDailyActiveUsers,
  getPredictionsPerDay,
  getAccuracyRate,
  getTopEventTypes,
} from "@/lib/telemetry/analytics";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "moderator"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [dau, predictionsPerDay, accuracyRate, topEvents] = await Promise.all(
      [
        getDailyActiveUsers(),
        getPredictionsPerDay(),
        getAccuracyRate(),
        getTopEventTypes(),
      ]
    );

    return NextResponse.json({
      dau,
      predictionsPerDay,
      accuracyRate,
      topEvents,
    });
  } catch (err) {
    console.error("Analytics GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
