"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function ChatRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const contextId = searchParams?.get("contextId");
    if (contextId) {
      router.replace(`/analyze?contextId=${contextId}&tab=chat`);
    } else {
      router.replace("/analyze");
    }
  }, [searchParams, router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
    </div>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    }>
      <ChatRedirect />
    </Suspense>
  );
}
