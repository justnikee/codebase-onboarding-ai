import { motion } from "framer-motion";

export function HowItWorks() {
  return (
    <div className="w-full max-w-4xl mx-auto mt-40">
      <div className="mb-16">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white">How it works</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-12 relative">
        <div className="hidden md:block absolute top-4 left-0 right-0 h-[1px] bg-white/5 z-0"></div>
        <div className="relative z-10 flex flex-col gap-4">
          <div className="w-8 h-8 bg-[#0a0a0a] border border-white/10 text-zinc-400 rounded-full flex items-center justify-center text-sm font-medium">1</div>
          <div>
            <h3 className="text-xl font-medium mb-2 text-white tracking-tight">Drop a link</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">Paste your GitHub URL or upload a local folder to get started immediately.</p>
          </div>
        </div>
        <div className="relative z-10 flex flex-col gap-4">
          <div className="w-8 h-8 bg-[#0a0a0a] border border-white/10 text-zinc-400 rounded-full flex items-center justify-center text-sm font-medium">2</div>
          <div>
            <h3 className="text-xl font-medium mb-2 text-white tracking-tight">AI maps the code</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">IBM watsonx analyzes dependencies, project structure, and core logic.</p>
          </div>
        </div>
        <div className="relative z-10 flex flex-col gap-4">
          <div className="w-8 h-8 bg-[#0a0a0a] border border-white/10 text-zinc-400 rounded-full flex items-center justify-center text-sm font-medium">3</div>
          <div>
            <h3 className="text-xl font-medium mb-2 text-white tracking-tight">Start exploring</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">Get answers instantly. Stop reading 100 files to find one function.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
