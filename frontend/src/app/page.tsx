"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import {
  Sparkles,
  Zap,
  Code2,
  MessageSquare,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  Github,
  Upload,
  Folder,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [showDemo, setShowDemo] = useState(false);
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

  const handleTryDemo = () => {
    setShowDemo(true);
    // Pre-fill with a popular repo
    setRepoUrl("https://github.com/vercel/next.js");
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
      // Start the analysis (non-blocking)
      const analysisPromise = api.analyzeRepository(repoUrl);
      
      // Get contextId from URL hash (repo URL hash)
      const contextId = btoa(repoUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      
      // Connect to progress stream immediately
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

          // Redirect when complete
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

      // Wait for analysis to complete
      const response = await analysisPromise;
      const actualContextId = response.contextId;

      // If we didn't receive any progress updates (cached response)
      if (!hasReceivedProgress) {
        eventSource.close();
        setProgress(100);
        setProgressMessage("Analysis complete!");
        setTimeout(() => {
          router.push(`/dashboard?contextId=${actualContextId}`);
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze repository");
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

      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Upload failed");
      }

      const contextId = data.data.contextId;

      // Connect to progress stream
      const eventSource = new EventSource(
        `http://localhost:5000/api/progress/${contextId}`
      );

      eventSource.onmessage = (event) => {
        const progressData = JSON.parse(event.data);
        if (progressData.type === "progress") {
          setProgress(progressData.progress);
          setProgressMessage(progressData.message);

          if (progressData.progress >= 100) {
            eventSource.close();
            setTimeout(() => {
              router.push(`/dashboard?contextId=${contextId}`);
            }, 500);
          }
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setTimeout(() => {
          router.push(`/dashboard?contextId=${contextId}`);
        }, 500);
      };
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

  if (showDemo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setShowDemo(false)}
            className="text-purple-200 hover:text-white mb-6 flex items-center gap-2"
          >
            ← Back to Home
          </button>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4">Try It Now</h2>
            <p className="text-purple-200 mb-6">
              Analyze a GitHub repository or upload your local project folder
            </p>

            {/* Mode Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setUploadMode("url")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  uploadMode === "url"
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-purple-200 hover:bg-white/20"
                }`}
              >
                <Github className="w-4 h-4 inline mr-2" />
                GitHub URL
              </button>
              <button
                onClick={() => setUploadMode("folder")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  uploadMode === "folder"
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-purple-200 hover:bg-white/20"
                }`}
              >
                <Folder className="w-4 h-4 inline mr-2" />
                Local Folder
              </button>
            </div>

            <div className="space-y-4">
              {uploadMode === "url" ? (
                <>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="https://github.com/owner/repository"
                    className="w-full px-6 py-4 bg-white/90 border-2 border-purple-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent text-lg"
                    disabled={isAnalyzing}
                  />

                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Analyze Repository
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <label className="block">
                    <div className="w-full px-6 py-8 bg-white/90 border-2 border-dashed border-purple-300 rounded-xl text-center cursor-pointer hover:bg-white/95 transition-all">
                      <Upload className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                      <p className="text-gray-700 font-medium mb-1">
                        Click to upload project files
                      </p>
                      <p className="text-gray-500 text-sm">
                        Select multiple files from your project
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isAnalyzing}
                    />
                  </label>
                </>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-300 bg-red-500/20 px-4 py-3 rounded-lg border border-red-400/30">
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Progress Bar */}
              {isAnalyzing && progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-purple-200">
                    <span>{progressMessage}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-purple-200 mb-3">
                  Try these examples:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "https://github.com/vercel/next.js",
                    "https://github.com/facebook/react",
                    "https://github.com/expressjs/express",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setRepoUrl(example)}
                      className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-purple-200 rounded-lg transition-colors border border-white/10"
                    >
                      {example.split("/").slice(-1)[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 px-4 py-2 rounded-full mb-6 border border-purple-400/30">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              Powered by IBM watsonx.ai
            </span>
          </div>

          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            AI-Powered Developer
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Onboarding Assistant
            </span>
          </h1>

          <p className="text-xl text-purple-200 mb-8 leading-relaxed">
            Analyze any GitHub repository and get instant, AI-generated
            onboarding documentation.
            <br />
            Save hours of manual documentation work with intelligent code
            analysis.
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleTryDemo}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 text-lg"
            >
              <Zap className="w-5 h-5" />
              Try Demo
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => window.open("https://github.com", "_blank")}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-8 rounded-xl border-2 border-white/20 hover:border-white/40 transition-all duration-200 flex items-center gap-2 text-lg backdrop-blur-sm"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <Code2 className="w-6 h-6 text-purple-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Smart Code Analysis
            </h3>
            <p className="text-purple-200">
              AI analyzes your repository structure, dependencies, and code
              patterns to generate comprehensive documentation.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-blue-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Interactive Chat
            </h3>
            <p className="text-purple-200">
              Ask questions about the codebase and get instant, context-aware
              answers from our AI assistant.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
              <GitBranch className="w-6 h-6 text-green-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Setup Guides</h3>
            <p className="text-purple-200">
              Get step-by-step setup instructions, architecture overviews, and
              best practices automatically generated.
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-12 border border-white/10 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Why Use Our Platform?
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Instant onboarding documentation",
              "AI-powered code understanding",
              "Interactive Q&A chatbot",
              "Technology stack detection",
              "Setup guide generation",
              "Architecture visualization",
              "Best practices recommendations",
              "Learning path suggestions",
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-purple-100">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-purple-200 mb-8 text-lg">
            Try it now with any public GitHub repository
          </p>
          <button
            onClick={handleTryDemo}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-12 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 text-lg mx-auto"
          >
            <Sparkles className="w-5 h-5" />
            Start Analyzing
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-white/10">
          <p className="text-purple-300 text-sm">
            Built with Next.js, Express, and IBM watsonx.ai
          </p>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
