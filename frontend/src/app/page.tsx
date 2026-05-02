"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "@/services/api";
import {
  Sparkles,
  Zap,
  Github,
  Upload,
  Folder,
  ArrowRight,
  Code2,
  MessageSquare,
  GitBranch,
  TerminalSquare,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BeforeAfterAnalytics } from "@/components/BeforeAfterAnalytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Home() {
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
      // Pass the user's access token if available
      const tokenToUse = (session as any)?.accessToken;
      
      const analysisPromise = api.analyzeRepository(repoUrl, tokenToUse);
      const contextId = btoa(repoUrl).replace(/[^a-zA-Z0-9]/g, "").substring(0, 32);

      const eventSource = new EventSource(
        `http://localhost:5000/api/progress/${contextId}`
      );

      let hasReceivedProgress = false;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "progress") {
          hasReceivedProgress = true;
          setProgress(data.progress);
          setProgressMessage(data.message);

          if (data.progress >= 100) {
            eventSource.close();
            setTimeout(() => {
              router.push(`/dashboard?contextId=${contextId}`);
            }, 500);
          }
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      const response = await analysisPromise;
      const actualContextId = response.contextId;

      if (!hasReceivedProgress) {
        eventSource.close();
        setProgress(100);
        setProgressMessage("Analysis complete!");
        setTimeout(() => {
          router.push(`/dashboard?contextId=${actualContextId}`);
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze repository. (Did you hit the GitHub API limit?)");
      setIsAnalyzing(false);
      setProgress(0);
      setProgressMessage("");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError("");
    setIsAnalyzing(true);
    setProgress(0);
    setProgressMessage("Uploading files...");

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("http://localhost:5000/api/upload/folder", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Upload failed");
      }

      setProgress(100);
      setProgressMessage("Analysis complete!");
      
      const contextId = data.data.contextId;
      setTimeout(() => {
        router.push(`/dashboard?contextId=${contextId}`);
      }, 500);
    } catch (err: any) {
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
    <div className="min-h-screen bg-[#020205] text-slate-200 relative overflow-hidden font-sans selection:bg-purple-500/30">
      {/* Background glowing effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none" />

      {/* Nav */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg">
              <TerminalSquare className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">DevBoard</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">
                  Signed in as <span className="text-white font-medium">{session.user?.name}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-muted-foreground hover:text-white">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => signIn("github")} className="bg-white text-black hover:bg-slate-200">
                <Github className="w-4 h-4 mr-2" />
                Sign in with GitHub
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-24 pb-32 relative z-10 flex flex-col items-center">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full mb-8 shadow-2xl">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium tracking-wide text-purple-100">
              Powered by IBM watsonx.ai
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-6 tracking-tighter">
            Ship code,
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              not docs.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Instantly generate comprehensive documentation, architecture diagrams, and interactive AI chat for any codebase to onboard developers 10x faster.
          </p>
        </motion.div>

        {/* Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl mb-24"
        >
          <Card className="bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
            <CardContent className="p-8 relative z-10">
              <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-black/50 border border-white/5 rounded-xl mb-8 p-1 h-12">
                  <TabsTrigger value="url" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-300">
                    <Github className="w-4 h-4 mr-2" />
                    GitHub URL
                  </TabsTrigger>
                  <TabsTrigger value="folder" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-300">
                    <Folder className="w-4 h-4 mr-2" />
                    Local Folder
                  </TabsTrigger>
                </TabsList>

                <div className="min-h-[140px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {uploadMode === "url" ? (
                      <motion.div
                        key="url"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="relative">
                          <Input
                            type="url"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="https://github.com/owner/repository"
                            className="h-14 bg-black/40 border-white/10 text-lg placeholder:text-slate-500 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 px-4 rounded-xl"
                            disabled={isAnalyzing}
                          />
                        </div>
                        <Button
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                          className="w-full h-14 bg-white text-black hover:bg-slate-200 text-lg font-semibold rounded-xl transition-all disabled:opacity-50"
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-3" />
                              Analyzing Repository...
                            </>
                          ) : (
                            <>
                              Analyze Repository <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="folder"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="block cursor-pointer group">
                          <div className="w-full h-[128px] bg-black/40 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-300">
                            <Upload className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                            <div className="text-center">
                              <p className="text-white font-medium">Browse local workspace</p>
                              <p className="text-sm text-slate-500 mt-1">Bypasses GitHub rate limits</p>
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
                      className="text-red-400 bg-red-500/10 px-4 py-3 rounded-lg border border-red-500/20 text-sm text-center mt-4"
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
                        className="overflow-hidden"
                      >
                        <div className="flex justify-between text-sm font-medium text-indigo-300 mb-2">
                          <span className="animate-pulse">{progressMessage}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2 bg-black/50 border border-white/5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
        </motion.div>

        {/* Before and After Analytics */}
        <BeforeAfterAnalytics />

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-32">
          {[
            {
              icon: Code2,
              title: "Deep Architecture Parsing",
              desc: "Understands your entire folder structure and identifies framework patterns automatically.",
            },
            {
              icon: MessageSquare,
              title: "Context-Aware Chat",
              desc: "Ask hyper-specific questions about your codebase and get code-referenced answers.",
            },
            {
              icon: GitBranch,
              title: "Onboarding Flows",
              desc: "Generates step-by-step setup guides that get new devs running in minutes.",
            }
          ].map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-indigo-500/10 border border-indigo-500/20">
                <feat.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feat.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
