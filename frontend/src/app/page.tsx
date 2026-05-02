"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/services/api";
import { HeroSection } from "@/components/home/HeroSection";
import { QuickDemo } from "@/components/home/QuickDemo";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyThisExists } from "@/components/home/WhyThisExists";

export default function Home() {
  const { data: session } = useSession();

  // Keep API client in sync with the current userId from the session
  useEffect(() => {
    api.setUserId((session as { userId?: string })?.userId ?? null);
  }, [session]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 relative overflow-hidden font-sans">
      <main className="container mx-auto px-4 pt-28 pb-16 relative z-10 flex flex-col items-center">
        <HeroSection />
        <QuickDemo />
        <HowItWorks />
        <WhyThisExists />
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-white/5 mt-16 bg-[#0a0a0a] relative z-10">
        <p className="text-zinc-500 font-medium text-sm">
          BOB - Built to make developers faster.
        </p>
      </footer>
    </div>
  );
}
