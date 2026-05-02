"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  useRealtimePredictions,
  useRealtimeLeaderboard,
  useRealtimeNotifications,
} from "@/hooks/use-realtime";

function RealtimeSubscriptions({ userId }: { userId: string }) {
  useRealtimePredictions(userId);
  useRealtimeLeaderboard();
  useRealtimeNotifications(userId);
  return null;
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUserId(session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {userId && <RealtimeSubscriptions userId={userId} />}
      {children}
    </>
  );
}
