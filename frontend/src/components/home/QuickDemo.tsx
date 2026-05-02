import {
  Sparkles,
  Route,
  BookOpen,
  MessageSquare,
  GitBranch,
  Layers,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";

export function QuickDemo() {
  return (
    <div className="w-full max-w-5xl mx-auto mt-40">
      <div className="text-center mb-24">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-white">
          What you get in seconds
        </h2>
        <p className="text-xl text-zinc-400">
          This replaces guesswork with clarity
        </p>
      </div>

      <div className="flex flex-col gap-32">
        {/* Row 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center gap-12 lg:gap-20"
        >
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-3 py-1 bg-white/5">
              <Sparkles className="w-3 h-3 text-orange-500/80" />
              <span className="text-[10px] font-medium text-orange-500/80 uppercase tracking-widest">
                Project Summary
              </span>
            </div>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Know what it does instantly.
            </h3>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Get a clear, concise explanation of the repository's purpose, main
              features, and target audience without having to read a single line
              of code.
            </p>
          </div>
          <div className="flex-1 w-full">
            <div className="w-full aspect-[4/3] bg-[#0d0d14] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col p-5 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              {/* Repo header */}
              <div className="flex items-center gap-2 mb-4">
                <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 font-mono">
                  expressjs / express
                </span>
                <span className="ml-auto px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[9px] text-green-400 font-semibold">
                  Analyzed
                </span>
              </div>
              {/* Summary text */}
              <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                A minimal, flexible{" "}
                <span className="text-white font-medium">
                  Node.js web framework
                </span>{" "}
                providing a robust set of features for web and mobile apps. Used
                by millions of developers worldwide.
              </p>
              {/* Tech badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {["Node.js", "JavaScript", "REST", "Middleware", "Router"].map(
                  (t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-zinc-800 border border-white/5 rounded-full text-[10px] text-zinc-400"
                    >
                      {t}
                    </span>
                  ),
                )}
              </div>
              {/* Stats row */}
              <div className="mt-auto flex items-center gap-4 pt-3 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-600">
                    Files scanned
                  </span>
                  <span className="text-sm font-bold text-white">248</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-600">Complexity</span>
                  <span className="text-sm font-bold text-orange-400">
                    Medium
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-600">Setup time</span>
                  <span className="text-sm font-bold text-green-400">
                    ~2 min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Row 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20"
        >
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-3 py-1 bg-white/5">
              <Route className="w-3 h-3 text-orange-500/80" />
              <span className="text-[10px] font-medium text-orange-500/80 uppercase tracking-widest">
                Architecture
              </span>
            </div>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Visualize the flow.
            </h3>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Understand the tech stack and how the frontend, API, and database
              connect. Stop guessing how components interact with each other.
            </p>
          </div>
          <div className="flex-1 w-full">
            <div className="w-full aspect-[4/3] bg-[#0d0d14] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center relative p-6">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
              <div className="flex flex-col items-center gap-3 w-full">
                {/* Top row */}
                <div className="flex items-center justify-center gap-8">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-16 h-14 bg-blue-500/10 border border-blue-500/25 rounded-xl flex flex-col items-center justify-center gap-1">
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span className="text-[9px] text-blue-400 font-semibold">
                        Next.js
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-600">Frontend</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-10 h-px bg-zinc-700" />
                    <span className="text-[8px] text-zinc-700">REST</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-16 h-14 bg-purple-500/10 border border-purple-500/25 rounded-xl flex flex-col items-center justify-center gap-1">
                      <GitBranch className="w-4 h-4 text-purple-400" />
                      <span className="text-[9px] text-purple-400 font-semibold">
                        Express
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-600">API Layer</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-10 h-px bg-zinc-700" />
                    <span className="text-[8px] text-zinc-700">query</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-16 h-14 bg-green-500/10 border border-green-500/25 rounded-xl flex flex-col items-center justify-center gap-1">
                      <Database className="w-4 h-4 text-green-400" />
                      <span className="text-[9px] text-green-400 font-semibold">
                        MongoDB
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-600">Database</span>
                  </div>
                </div>
                {/* IBM WatsonX badge */}
                <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-orange-500/5 border border-orange-500/20 rounded-full">
                  <Sparkles className="w-3 h-3 text-orange-400" />
                  <span className="text-[10px] text-orange-400 font-medium">
                    Mapped by IBM WatsonX
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Row 3 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center gap-12 lg:gap-20"
        >
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-3 py-1 bg-white/5">
              <BookOpen className="w-3 h-3 text-orange-500/80" />
              <span className="text-[10px] font-medium text-orange-500/80 uppercase tracking-widest">
                Setup Guide
              </span>
            </div>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Run it locally, fast.
            </h3>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Skip the broken README instructions. Get a step-by-step,
              actionable setup guide generated directly from analyzing package
              files and configs.
            </p>
          </div>
          <div className="flex-1 w-full">
            <div className="w-full aspect-[4/3] bg-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative font-mono text-sm">
              <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-[#0a0a0a]">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
              <div className="p-6 flex flex-col gap-3">
                <div className="text-zinc-500">
                  $ <span className="text-white">npm install</span>
                </div>
                <div className="text-zinc-600">added 142 packages in 3s</div>
                <div className="text-zinc-500 mt-2">
                  $ <span className="text-white">npm run dev</span>
                </div>
                <div className="text-zinc-600">
                  ready - started server on 0.0.0.0:3000
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Row 4 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20"
        >
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-3 py-1 bg-white/5">
              <MessageSquare className="w-3 h-3 text-orange-500/80" />
              <span className="text-[10px] font-medium text-orange-500/80 uppercase tracking-widest">
                Contextual Q&A
              </span>
            </div>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Ask anything about the code.
            </h3>
            <p className="text-lg text-zinc-400 leading-relaxed">
              "Where is auth handled?" "How does the cart state work?" Get
              direct answers with file references instead of searching blindly.
            </p>
          </div>
          <div className="flex-1 w-full">
            <div className="w-full aspect-[4/3] bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative p-6">
              <div className="flex flex-col gap-4">
                <div className="self-end bg-white/10 text-white text-sm px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">
                  Where is the user authentication handled?
                </div>
                <div className="self-start bg-zinc-900 border border-white/5 text-zinc-300 text-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] space-y-2">
                  <p>Authentication is handled using NextAuth.js.</p>
                  <div className="bg-black/50 p-2 rounded border border-white/5 font-mono text-xs text-zinc-500">
                    src/app/api/auth/[...nextauth]/route.ts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
