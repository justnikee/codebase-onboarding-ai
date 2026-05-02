"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/services/api";
import { motion } from "framer-motion";
import {
  GitBranch,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";

interface HistoryItem {
  id: string;
  repo_url: string;
  repo_full_name: string | null;
  context_id: string;
  status: string;
  summary_snapshot: string | null;
  readiness_score: number | null;
  created_at: string;
  completed_at: string | null;
}

export default function HistoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.setUserId((session as any)?.userId ?? null);
  }, [session]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      api
        .getHistory()
        .then((data) => setItems(data))
        .catch((err) => setError(err.message || "Failed to load history"))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const repoLabel = (item: HistoryItem) =>
    item.repo_full_name ?? item.repo_url.replace("https://github.com/", "");

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-secondary/10 blur-[150px] pointer-events-none" />

      {/* Nav */}
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-32 relative z-10 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Analysis History
          </h1>
          <p className="text-muted-foreground mb-10">
            Your previously analyzed repositories.
          </p>

          {loading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading history…</span>
            </div>
          )}

          {error && (
            <p className="text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No analyses yet.</p>
              <p className="text-sm mt-1">
                Analyze a repository to see it here.
              </p>
              <Button
                className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => router.push("/")}
              >
                Analyze a repo
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="bg-card border-border hover:border-accent-primary/40 transition-colors cursor-pointer group">
                  <CardContent
                    className="p-5"
                    onClick={() =>
                      router.push(`/dashboard?contextId=${item.context_id}`)
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <GitBranch className="w-4 h-4 text-accent-primary shrink-0" />
                          <span className="font-semibold text-foreground truncate">
                            {repoLabel(item)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-xs bg-success/10 text-success border-success/20"
                          >
                            {item.status}
                          </Badge>
                        </div>

                        {item.summary_snapshot && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {item.summary_snapshot}
                          </p>
                        )}

                        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(item.created_at)}</span>
                          {item.readiness_score != null && (
                            <>
                              <span className="mx-2">·</span>
                              <span>
                                Readiness score: {item.readiness_score}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent-primary transition-colors shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
