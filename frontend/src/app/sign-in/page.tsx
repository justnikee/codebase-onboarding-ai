"use client";

import { signIn } from "next-auth/react";
import { Github, TerminalSquare, Zap } from "lucide-react";

export default function SignIn() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-primary to-violet-500 rounded-2xl flex items-center justify-center shadow-glow mb-4">
            <TerminalSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome to DevBoard
          </h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Sign in to save analyses and track history
          </p>
        </div>

        {/* Card */}
        <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-6 shadow-elevated space-y-4">
          {/* Free tier note */}
          <div className="flex items-start gap-3 p-3 bg-accent-primary/5 border border-accent-primary/15 rounded-xl">
            <Zap className="w-4 h-4 text-accent-primary mt-0.5 shrink-0" />
            <p className="text-xs text-foreground/70 leading-relaxed">
              <span className="font-semibold text-foreground">
                No account required
              </span>{" "}
              to analyze repositories. Sign in to unlock history, saved
              analyses, and team sharing.
            </p>
          </div>

          <button
            onClick={() => signIn("github", { callbackUrl: "/analyze" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-foreground hover:bg-foreground/90 text-background font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>

          <p className="text-xs text-center text-muted-foreground">
            By signing in you agree to our terms. Your data is used only to
            provide the service.
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          Just want to analyze?{" "}
          <a
            href="/analyze"
            className="text-accent-primary hover:underline font-medium"
          >
            Skip sign in →
          </a>
        </p>
      </div>
    </div>
  );
}
