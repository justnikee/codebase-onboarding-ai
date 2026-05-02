"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  TerminalSquare,
  LogOut,
  ChevronDown,
  Cpu,
  LayoutDashboard,
} from "lucide-react";

export function AppHeader() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-border-subtle h-14 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-7 h-7 bg-gradient-to-br from-accent-primary to-violet-500 rounded-lg flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all duration-300">
            <TerminalSquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground tracking-tight text-base">
            DevBoard
          </span>
          <span className="hidden sm:flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-accent-primary/10 border border-accent-primary/20 rounded text-[10px] font-semibold text-accent-primary uppercase tracking-wider">
            <Cpu className="w-2.5 h-2.5" />
            MCP
          </span>
        </Link>

        {/* Right — auth */}
        <div className="flex items-center gap-2 shrink-0">
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-bg-elevated animate-pulse" />
          ) : session?.user ? (
            <>
              <Link
                href="/analyze"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-bg-elevated transition-all"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-elevated transition-all group"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "User"}
                      className="w-7 h-7 rounded-full ring-2 ring-accent-primary/30 group-hover:ring-accent-primary/60 transition-all"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-sm">
                      {session.user.name?.[0] ?? "U"}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-foreground/80 max-w-[120px] truncate">
                    {session.user.name}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-bg-secondary border border-border-subtle rounded-xl shadow-elevated overflow-hidden z-50">
                    <div className="px-3 py-2.5 border-b border-border-subtle">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-bg-elevated transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-all shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
