"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/services/api";
import {
  Sparkles,
  Github,
  Upload,
  Folder,
  ArrowRight,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function HeroSection() {
  const router = useRouter();
  const { data: session } = useSession();
  const [repoUrl, setRepoUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [uploadMode, setUploadMode] = useState<"url" | "folder">("url");

  const validateGitHubUrl = (url: string): boolean => {
    const githubPattern =
      /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubPattern.test(url);
  };

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    if (!validateGitHubUrl(repoUrl)) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }

    setError("");
    setIsAnalyzing(true);
    setProgress(5);
    setProgressMessage("Initializing analysis...");

    try {
      const tokenToUse = (session as any)?.accessToken;

      // Simulate stepped progress while the API call runs in parallel
      const steps: [number, string][] = [
        [15, "Fetching repository metadata..."],
        [30, "Scanning file structure..."],
        [48, "Analyzing tech stack..."],
        [63, "Running AI analysis..."],
        [78, "Generating insights..."],
        [88, "Finalizing results..."],
      ];
      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          const [pct, msg] = steps[stepIndex];
          setProgress(pct);
          setProgressMessage(msg);
          stepIndex++;
        }
      }, 1800);

      const response = await api.analyzeRepository(repoUrl, tokenToUse);
      clearInterval(progressInterval);

      setProgress(100);
      setProgressMessage("Analysis complete!");

      setTimeout(() => {
        router.push(`/analyze?contextId=${response.contextId}`);
      }, 500);
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to analyze repository. (Did you hit the GitHub API limit?)",
      );
      setIsAnalyzing(false);
      setProgress(0);
      setProgressMessage("");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Derive project name from the first file's webkitRelativePath root segment
    const firstFile = files[0] as File & { webkitRelativePath?: string };
    const projectName = firstFile.webkitRelativePath
      ? firstFile.webkitRelativePath.split("/")[0]
      : "uploaded-project";

    setError("");
    setIsAnalyzing(true);
    setProgress(5);
    setProgressMessage("Preparing files...");

    // After bytes finish uploading (~50%), step through server-side AI stages
    const aiSteps: [number, string][] = [
      [55, "Analyzing project structure..."],
      [65, "Detecting tech stack..."],
      [75, "Running AI analysis..."],
      [85, "Generating insights..."],
      [90, "Finalizing results..."],
    ];
    let stepIndex = 0;
    let aiInterval: ReturnType<typeof setInterval> | null = null;

    try {
      const result = await api.uploadFolder(
        files,
        projectName,
        (pct, status) => {
          setProgress(pct);
          setProgressMessage(status);
          // Once upload bytes are done, kick off AI stage ticks
          if (pct >= 50 && !aiInterval) {
            aiInterval = setInterval(() => {
              if (stepIndex < aiSteps.length) {
                const [p, msg] = aiSteps[stepIndex++];
                setProgress(p);
                setProgressMessage(msg);
              }
            }, 2000);
          }
        },
      );

      if (aiInterval) clearInterval(aiInterval);
      setProgress(100);
      setProgressMessage("Analysis complete!");

      setTimeout(() => {
        router.push(`/analyze?contextId=${result.contextId}`);
      }, 500);
    } catch (err: any) {
      if (aiInterval) clearInterval(aiInterval);
      setError(err.message || "Failed to upload files");
      setIsAnalyzing(false);
      setProgress(0);
      setProgressMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isAnalyzing) {
      handleAnalyze();
    }
  };

  return (
    <>
      <motion.div
        id="hero"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-4xl mx-auto mb-16 scroll-mt-24"
      >
        <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-4 py-1.5 mb-8 bg-white/5">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
            Built with IBM AI
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tighter leading-tight">
          Understand any codebase
          <br className="hidden md:block" /> in seconds.
        </h1>

        <p className="text-lg md:text-lg text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Paste a repo and get a clear breakdown of how everything works —
          architecture, setup steps, and answers to your questions.
        </p>
      </motion.div>{" "}
      <motion.div
        id="analyze-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl mb-12"
      >
        <div className="w-full flex flex-col items-center">
          <Tabs
            value={uploadMode}
            onValueChange={(v) => setUploadMode(v as any)}
            className="w-full flex flex-col items-center"
          >
            <div className="flex justify-center w-full mb-6">
              <TabsList className="inline-flex bg-transparent border border-white/10 rounded-full p-1 h-auto">
                <TabsTrigger
                  value="url"
                  className="rounded-full px-5 py-2 text-sm font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-500 transition-all duration-300"
                >
                  <Github className="w-4 h-4 mr-2" />
                  GitHub URL
                </TabsTrigger>
                <TabsTrigger
                  value="folder"
                  className="rounded-full px-5 py-2 text-sm font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-500 transition-all duration-300"
                >
                  <Folder className="w-4 h-4 mr-2" />
                  Local Folder
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="w-full max-w-2xl flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {uploadMode === "url" ? (
                  <motion.div
                    key="url"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <div className="relative flex items-center bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-full p-2 shadow-2xl shadow-black/50 overflow-hidden">
                      <Input
                        type="url"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="https://github.com/your/repo"
                        className="h-12 bg-transparent border-0 text-base placeholder:text-zinc-600 focus-visible:ring-0 px-6 w-full text-white"
                        disabled={isAnalyzing}
                      />
                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="h-12 px-8 bg-white text-black hover:bg-zinc-200 text-sm font-semibold rounded-full transition-all duration-200 whitespace-nowrap ml-2"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            Analyze <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="folder"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <label className="block cursor-pointer group w-full">
                      <div className="w-full h-24 bg-zinc-900/50 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-white/30 hover:bg-zinc-900 transition-all duration-300">
                        <Upload className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors duration-300" />
                        <div className="text-center flex flex-col items-center gap-1">
                          <p className="text-zinc-300 font-medium text-sm">
                            Browse local workspace
                          </p>
                          <p className="text-xs text-zinc-600">
                            Bypasses GitHub rate limits
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        // @ts-ignore
                        webkitdirectory=""
                        directory=""
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isAnalyzing}
                      />
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-red-400 bg-red-400/10 px-4 py-3 rounded-lg border border-red-400/20 text-sm text-center mt-4 w-full"
                >
                  {error}
                </motion.div>
              )}

              {/* Progress UI */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden w-full px-4"
                  >
                    <div className="flex justify-between text-sm font-medium text-zinc-400 mb-2">
                      <span className="animate-pulse">{progressMessage}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5 bg-zinc-800" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Tabs>
        </div>

        {/* Action Card Features */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-zinc-500 font-medium">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-zinc-300" />
            Project summary
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-zinc-300" />
            Architecture overview
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-zinc-300" />
            Setup steps
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-zinc-300" />
            Ask anything
          </div>
        </div>
      </motion.div>
      {/* Product visual fade/gradient overlay */}
      <div className="w-full max-w-5xl mx-auto mt-16 relative">
        <div
          className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 pointer-events-none h-full"
          style={{
            background:
              "linear-gradient(to top, #0a0a0a 10%, transparent 100%)",
          }}
        />
        {/* You can replace this with an actual screenshot of the app dashboard later */}
        <div className="w-full aspect-[16/9] bg-zinc-900 border border-white/10 rounded-t-2xl shadow-2xl shadow-black relative overflow-hidden flex items-start justify-center pt-8">
          <div className="w-full max-w-3xl border border-white/5 bg-black rounded-lg h-full shadow-2xl relative flex">
            {/* Fake Sidebar */}
            <div className="w-48 border-r border-white/5 h-full p-4 flex flex-col gap-2 opacity-50">
              <div className="w-24 h-3 bg-zinc-800 rounded mb-4" />
              <div className="w-full h-2 bg-zinc-800 rounded" />
              <div className="w-3/4 h-2 bg-zinc-800 rounded" />
              <div className="w-5/6 h-2 bg-zinc-800 rounded" />
            </div>
            {/* Fake Main Area */}
            <div className="flex-1 p-6 flex flex-col gap-4 opacity-50">
              <div className="w-48 h-5 bg-zinc-800 rounded mb-6" />
              <div className="w-full h-32 bg-zinc-900 rounded border border-white/5" />
              <div className="flex gap-4">
                <div className="flex-1 h-24 bg-zinc-900 rounded border border-white/5" />
                <div className="flex-1 h-24 bg-zinc-900 rounded border border-white/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
