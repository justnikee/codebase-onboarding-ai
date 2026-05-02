"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  TerminalSquare,
  Github,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brandHovered, setBrandHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Demo", href: "#demo" },
  ];

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      // If we're on the home page, scroll to section
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        // Navigate to home page with hash
        router.push(`/${href}`);
      }
    } else {
      router.push(href);
    }
  };

  const handleAnalyze = () => {
    setMobileOpen(false);
    // Scroll to the action card on the home page
    const actionCard = document.querySelector("#analyze-section");
    if (actionCard) {
      actionCard.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col">
      {/* Announcement Bar */}
      <div className="bg-zinc-900 border-b border-white/5 py-1.5 flex justify-center items-center gap-2">
        <span className="text-xs">✨</span>
        <span className="text-xs font-medium text-zinc-300">
          Powered by IBM Bob
        </span>
      </div>

      <nav
        className={`
          w-full transition-all duration-500
          ${scrolled
            ? "bg-black/80 backdrop-blur-2xl border-b border-white/5 shadow-none"
            : "bg-transparent border-b border-transparent"
          }
        `}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* ── LEFT: Brand ── */}
        <button
          onClick={() => router.push("/")}
          onMouseEnter={() => setBrandHovered(true)}
          onMouseLeave={() => setBrandHovered(false)}
          className="flex items-center gap-2 group relative"
        >
          <div className="bg-primary p-1.5 rounded-lg transition-shadow duration-300">
            <TerminalSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">
            DevBoard
          </span>

          {/* Tagline on hover */}
          <AnimatePresence>
            {brandHovered && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="absolute left-full ml-3 text-xs text-muted-foreground whitespace-nowrap hidden lg:block"
              >
                AI Developer Intelligence
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* ── CENTER: Navigation (desktop) ── */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href)}
              className="relative px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-white/[0.04]"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* ── RIGHT: CTA + Auth ── */}
        <div className="hidden md:flex items-center gap-3">
          {/* Primary CTA */}
          <button
            onClick={handleAnalyze}
            className="relative group px-4 py-2.5 rounded-[10px] bg-white text-black text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Analyze Repo
            </span>
          </button>

          {/* Auth */}
          {session ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/history")}
                className="text-muted-foreground hover:text-foreground hover:bg-white/[0.04] text-xs"
              >
                History
              </Button>
              <div className="w-px h-4 bg-white/10" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-foreground hover:bg-white/[0.04] text-xs gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signIn("github")}
              className="text-muted-foreground hover:text-foreground hover:bg-white/[0.04] text-xs gap-1.5"
            >
              <Github className="w-3.5 h-3.5" />
              Sign in
            </Button>
          )}
        </div>

        {/* ── MOBILE: Hamburger ── */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-black/95 backdrop-blur-2xl border-b border-white/5"
          >
            <div className="container mx-auto px-6 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
                  className="text-left text-sm text-muted-foreground hover:text-foreground py-2 px-3 rounded-lg hover:bg-white/[0.04] transition-colors"
                >
                  {link.label}
                </button>
              ))}

              <div className="border-t border-white/5 my-2" />

              {/* CTA (mobile) */}
              <button
                onClick={handleAnalyze}
                className="w-full py-3 rounded-[10px] bg-white text-black text-sm font-semibold hover:shadow-lg transition-all duration-200"
              >
                Analyze Repo
              </button>

              {/* Auth (mobile) */}
              {session ? (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      router.push("/history");
                    }}
                    className="text-left text-sm text-muted-foreground hover:text-foreground py-2 px-3 rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    History
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="text-left text-sm text-muted-foreground hover:text-foreground py-2 px-3 rounded-lg hover:bg-white/[0.04] transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn("github")}
                  className="text-left text-sm text-muted-foreground hover:text-foreground py-2 px-3 rounded-lg hover:bg-white/[0.04] transition-colors flex items-center gap-2"
                >
                  <Github className="w-3.5 h-3.5" />
                  Sign in with GitHub
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>
    </header>
  );
}
