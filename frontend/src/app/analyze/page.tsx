"use client";

import {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Search,
  Star,
  GitFork,
  FileCode,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  BookOpen,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldAlert,
  Download,
  History,
  FolderOpen,
  Bot,
  User,
  Send,
  Sparkles,
  FileCode2,
  ShieldCheck,
  ShieldQuestion,
  Trash2,
  Github,
  BarChart2,
  GitBranch,
  Package,
  Cpu,
  Target,
  GitPullRequest,
  Plug,
  Clock,
} from "lucide-react";
import {
  api,
  type RepoMetrics,
  type FirstTaskPlan,
  type CodeInsights,
} from "@/services/api";
import { FolderUploadModal } from "@/components/FolderUploadModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Dynamic imports ──────────────────────────────────────────────────────────
const ArchitectureGraph = dynamic(
  () =>
    import("@/components/ArchitectureGraph").then((m) => ({
      default: m.ArchitectureGraph,
    })),
  { ssr: false },
);

// ─── Dynamic Recharts imports (only loaded when Architecture tab is active) ───
const BarChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.BarChart })),
  { ssr: false },
);
const Bar = dynamic(
  () => import("recharts").then((m) => ({ default: m.Bar })),
  { ssr: false },
);
const XAxis = dynamic(
  () => import("recharts").then((m) => ({ default: m.XAxis })),
  { ssr: false },
);
const YAxis = dynamic(
  () => import("recharts").then((m) => ({ default: m.YAxis })),
  { ssr: false },
);
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => ({ default: m.CartesianGrid })),
  { ssr: false },
);
const RechartsTooltip = dynamic(
  () => import("recharts").then((m) => ({ default: m.Tooltip })),
  { ssr: false },
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => ({ default: m.ResponsiveContainer })),
  { ssr: false },
);
const PieChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.PieChart })),
  { ssr: false },
);
const Pie = dynamic(
  () => import("recharts").then((m) => ({ default: m.Pie })),
  { ssr: false },
);
const Cell = dynamic(
  () => import("recharts").then((m) => ({ default: m.Cell })),
  { ssr: false },
);
const RechartsLegend = dynamic(
  () => import("recharts").then((m) => ({ default: m.Legend })),
  { ssr: false },
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnalysisData {
  contextId: string;
  repoUrl: string;
  metadata: {
    name: string;
    fullName: string;
    description: string | null;
    language: string | null;
    stars: number;
    forks: number;
    createdAt: string;
    updatedAt: string;
    defaultBranch?: string;
  };
  techStack: {
    languages: string[];
    frameworks: string[];
    tools: string[];
  };
  summary: string;
  setupSteps: string[];
  architecture: string;
  readme?: string | null;
  scripts?: Record<string, string>;
  keyFiles?: Record<string, string | null>;
  dependencies?: string[] | Record<string, Record<string, string>>;
  analyzedAt: string;
  metrics?: RepoMetrics;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  relevantFiles?: string[];
  confidence?: "high" | "medium" | "low";
  isStreaming?: boolean;
}

interface HistoryEntry {
  contextId: string;
  repoUrl: string;
  analyzedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#ffac45",
  Kotlin: "#A97BFF",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Shell: "#89e051",
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "bg-red-500/10 border-red-500/30 text-red-400",
  high: "bg-orange-500/10 border-orange-500/30 text-orange-400",
  medium: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  low: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  info: "bg-muted border-border text-foreground/70",
};

const COMPLEXITY_LABEL: Record<string, string> = {
  low: "Beginner Friendly",
  medium: "Intermediate",
  high: "Expert Required",
};

const COMPLEXITY_COLOR: Record<string, string> = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-red-400",
};

// ─── Multi-Persona Onboarding ─────────────────────────────────────────────────
type Persona = "new-dev" | "tech-lead" | "pm" | "contributor";

const PERSONA_INFO: Record<
  Persona,
  {
    label: string;
    description: string;
    textColor: string;
    badgeBg: string;
    badgeBorder: string;
    tab: string;
    chatHint: string;
    setupBanner: string;
  }
> = {
  "new-dev": {
    label: "New Developer",
    description: "Get set up and productive fast",
    textColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/15",
    badgeBorder: "border-emerald-500/40",
    tab: "setup",
    chatHint: "Ask me how to set up, run tests, or make my first commit...",
    setupBanner:
      "Start with the setup steps, then jump to First Tasks to make your first contribution quickly.",
  },
  "tech-lead": {
    label: "Tech Lead",
    description: "Assess architecture & technical risk",
    textColor: "text-violet-400",
    badgeBg: "bg-violet-500/15",
    badgeBorder: "border-violet-500/40",
    tab: "architecture",
    chatHint:
      "Ask me about architecture decisions, hotspots, or technical debt...",
    setupBanner:
      "Review Code Hotspots & Risks for complexity issues, then explore the Architecture tab for dependency structure.",
  },
  pm: {
    label: "Product Manager",
    description: "Understand scope & delivery timeline",
    textColor: "text-blue-400",
    badgeBg: "bg-blue-500/15",
    badgeBorder: "border-blue-500/40",
    tab: "summary",
    chatHint:
      "Ask me about project scope, team onboarding cost, or delivery risk...",
    setupBanner:
      "The readiness score and onboarding timeline show the true complexity cost for planning.",
  },
  contributor: {
    label: "Contributor",
    description: "Find your first PR fast",
    textColor: "text-amber-400",
    badgeBg: "bg-amber-500/15",
    badgeBorder: "border-amber-500/40",
    tab: "setup",
    chatHint:
      "Ask me about good first issues, contribution areas, or code conventions...",
    setupBanner:
      "Check First Tasks for curated entry points. Quick Wins are bite-sized contributions to get you your first merged PR.",
  },
};

// ─── Handoff Pack Export ──────────────────────────────────────────────────────
function generateHandoffMd(data: AnalysisData): string {
  const date = new Date(data.analyzedAt).toLocaleDateString();
  return `# Developer Handoff Pack — ${data.metadata.fullName}

> Generated by DevBoard on ${date}

## Overview
${data.summary}

${data.metadata.description ? `> *"${data.metadata.description}"*\n` : ""}

## Repository Info
- **URL**: ${data.repoUrl}
- **Primary Language**: ${data.metadata.language || "Multiple"}
- **Stars**: ${data.metadata.stars} | **Forks**: ${data.metadata.forks}

## Tech Stack
- **Languages**: ${data.techStack.languages.join(", ") || "—"}
- **Frameworks**: ${data.techStack.frameworks.join(", ") || "—"}
- **Tools**: ${data.techStack.tools.join(", ") || "—"}

## Setup Guide
${data.setupSteps.map((s, i) => `${i + 1}. ${s.replace(/^\d+\.\s*/, "")}`).join("\n")}

## Architecture
${data.architecture}

${
  data.scripts && Object.keys(data.scripts).length > 0
    ? `## Available Scripts\n\`\`\`\n${Object.entries(data.scripts)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")}\n\`\`\`\n`
    : ""
}

---
*Powered by DevBoard + IBM WatsonX Granite*
`;
}

// ─── Readiness Ring ───────────────────────────────────────────────────────────
const ReadinessRing = memo(function ReadinessRing({
  score,
}: {
  score: number;
}) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Ready" : score >= 50 ? "Fair" : "Needs Work";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${score} ${100 - score}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{score}</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>
        {label}
      </span>
    </div>
  );
});

// ─── Prose Content Renderer ──────────────────────────────────────────────────
function ProseContent({ text }: { text: string }) {
  if (!text) return null;

  return (
    <div className="space-y-0.5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }: any) => (
            <h1 className="text-base font-bold text-foreground mt-4 mb-1.5 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }: any) => (
            <h2 className="text-sm font-semibold text-foreground mt-3 mb-1 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }: any) => (
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50 mt-4 mb-1 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }: any) => (
            <p className="text-sm text-foreground/70 leading-6 my-0.5">
              {children}
            </p>
          ),
          ul: ({ children }: any) => (
            <ul className="my-1.5 space-y-1">{children}</ul>
          ),
          ol: ({ children }: any) => (
            <ol className="my-1.5 space-y-1 list-decimal pl-5 text-sm text-foreground/70">
              {children}
            </ol>
          ),
          li: ({ children }: any) => (
            <li className="flex items-start gap-2.5 text-sm text-foreground/70 leading-6">
              <span className="mt-[10px] w-1 h-1 rounded-full bg-foreground/30 flex-shrink-0" />
              <span className="flex-1">{children}</span>
            </li>
          ),
          // pre wraps block code — pass through, styling comes from code
          pre: ({ children }: any) => <>{children}</>,
          code: ({ className, children }: any) => {
            const code = String(children).replace(/\n$/, "");
            // fenced code blocks have a language className or contain newlines
            const isBlock = code.includes("\n") || Boolean(className);
            if (isBlock) {
              return (
                <pre className="my-2 rounded-lg bg-bg-elevated border border-border-subtle overflow-x-auto">
                  <code className="block p-3 text-[11px] font-mono text-foreground/80 leading-5 whitespace-pre">
                    {code}
                  </code>
                </pre>
              );
            }
            return (
              <code className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-bg-elevated text-accent-primary">
                {code}
              </code>
            );
          },
          strong: ({ children }: any) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }: any) => (
            <em className="italic text-foreground/80">{children}</em>
          ),
          blockquote: ({ children }: any) => (
            <blockquote className="my-2 pl-3 border-l-2 border-accent-primary/40 text-foreground/60 italic text-sm">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-border-subtle" />,
          a: ({ href, children }: any) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary underline underline-offset-2 hover:text-accent-primary/80 transition-colors"
            >
              {children}
            </a>
          ),
          table: ({ children }: any) => (
            <div className="my-2 overflow-x-auto rounded-lg border border-border-subtle">
              <table className="w-full text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          th: ({ children }: any) => (
            <th className="px-3 py-1.5 text-left font-semibold text-foreground/70 bg-bg-elevated border-b border-border-subtle">
              {children}
            </th>
          ),
          td: ({ children }: any) => (
            <td className="px-3 py-1.5 text-foreground/60 border-b border-border-subtle/50">
              {children}
            </td>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

// ─── Metric Pill ──────────────────────────────────────────────────────────────
const MetricPill = memo(function MetricPill({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-bg-secondary border border-border-subtle">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <p className="text-xs font-medium text-muted-foreground truncate">
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold text-foreground leading-none tracking-tight">
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground/60">{sub}</p>}
    </div>
  );
});

// ─── First Task Panel ─────────────────────────────────────────────────────────
const FirstTaskPanel = memo(function FirstTaskPanel({
  contextId,
}: {
  contextId: string;
}) {
  const [plan, setPlan] = useState<FirstTaskPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    if (plan || loading) return;
    setLoading(true);
    try {
      const data = await api.getFirstTasks(contextId);
      setPlan(data);
      setExpanded(true);
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, [contextId, plan, loading]);

  return (
    <Card className="bg-bg-secondary border border-border-subtle">
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer select-none"
        onClick={() => {
          load();
          setExpanded((e) => !e);
        }}
      >
        <div className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-emerald-500" />
          <CardTitle className="text-sm font-medium">Where to Start</CardTitle>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {!loading && !plan && (
            <span className="text-xs">Click to generate</span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </CardHeader>
      {expanded && plan && (
        <CardContent className="space-y-4 pt-0">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              Recommended First Task
            </p>
            <p className="font-semibold text-white mb-1">
              {plan.starterTask.title}
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              {plan.starterTask.description}
            </p>
            <p className="text-xs text-emerald-400 italic">
              Why: {plan.starterTask.why}
            </p>
            {plan.starterTask.files.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {plan.starterTask.files.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-bg-elevated border border-border-subtle rounded text-xs font-mono"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Read First
              </p>
              <ul className="space-y-1">
                {plan.filesToRead.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-muted text-foreground text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="font-mono text-xs text-foreground/70">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Quick Wins
              </p>
              <ul className="space-y-2">
                {plan.quickWins.map((w, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground/70"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {plan.learningPath.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Learning Path
              </p>
              <div className="flex flex-wrap gap-2">
                {plan.learningPath.map((topic, i) => (
                  <Badge key={i} variant="secondary">
                    {i + 1}. {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
});

// ─── Hotspot Panel ────────────────────────────────────────────────────────────
const HotspotPanel = memo(function HotspotPanel({
  contextId,
}: {
  contextId: string;
}) {
  const [insights, setInsights] = useState<CodeInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (insights || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCodeInsights(contextId);
      setInsights(data);
      setExpanded(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load code analysis",
      );
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  }, [contextId, insights, loading]);

  const QUALITY_COLOR: Record<string, string> = {
    none: "text-red-400",
    partial: "text-amber-400",
    good: "text-blue-400",
    excellent: "text-emerald-400",
    poor: "text-red-400",
    fair: "text-amber-400",
    low: "text-emerald-400",
    medium: "text-amber-400",
    high: "text-red-400",
  };

  return (
    <Card className="bg-bg-secondary border border-border-subtle">
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer select-none"
        onClick={() => {
          if (!insights && !error) {
            load();
          } else {
            setExpanded((e) => !e);
          }
        }}
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-sm font-medium">
            Code Hotspots &amp; Risks
          </CardTitle>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {!loading && !insights && (
            <span className="text-xs">Click to analyze</span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </CardHeader>
      {expanded && error && (
        <CardContent className="pt-0">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        </CardContent>
      )}
      {expanded && insights && (
        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Complexity", value: insights.metrics.complexity },
              {
                label: "Maintainability",
                value: `${insights.metrics.maintainability}/100`,
              },
              { label: "Test Coverage", value: insights.metrics.testCoverage },
              { label: "Docs Quality", value: insights.metrics.documentation },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="p-3 rounded-xl bg-bg-elevated border border-border-subtle text-center"
              >
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p
                  className={`font-semibold capitalize text-sm ${QUALITY_COLOR[String(value).toLowerCase().split("/")[0]] ?? "text-foreground/70"}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
          {insights.smells.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Code Smells (
                {insights.smells.length})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {insights.smells.slice(0, 8).map((s, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border text-sm ${SEVERITY_COLOR[s.severity]}`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold">{s.type}</span>
                      <Badge
                        variant="outline"
                        className="text-xs capitalize border-current"
                      >
                        {s.severity}
                      </Badge>
                    </div>
                    <p className="font-mono text-xs opacity-70 mb-1">
                      {s.file}
                    </p>
                    <p className="text-xs">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
});

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = memo(function MessageBubble({
  message,
}: {
  message: ChatMessage;
}) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const isUser = message.role === "user";

  const ConfidenceIcon =
    message.confidence === "high"
      ? ShieldCheck
      : message.confidence === "low"
        ? ShieldAlert
        : ShieldQuestion;
  const confidenceColor =
    message.confidence === "high"
      ? "text-emerald-400"
      : message.confidence === "low"
        ? "text-red-400"
        : "text-amber-400";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
          isUser ? "bg-accent-primary/20" : "bg-violet-500/20"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-accent-primary" />
        ) : (
          <Bot className="w-4 h-4 text-violet-400" />
        )}
      </div>
      <div
        className={`max-w-[80%] space-y-1 ${isUser ? "items-end" : "items-start"} flex flex-col`}
      >
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-6 ${
            isUser
              ? "bg-accent-primary text-white rounded-tr-sm"
              : "bg-bg-secondary border border-border-subtle text-foreground rounded-tl-sm"
          }`}
        >
          {isUser ? (
            message.content
          ) : message.isStreaming && !message.content ? (
            // Typing indicator — shown while waiting for first chunk
            <div className="flex items-center gap-1 py-0.5 px-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-dot-bounce"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </div>
          ) : (
            <>
              <ProseContent text={message.content} />
              {message.isStreaming && (
                <span className="inline-block w-[2px] h-[14px] bg-foreground/70 ml-0.5 relative top-[2px] animate-cursor-blink" />
              )}
            </>
          )}
        </div>
        {!isUser &&
          (message.confidence ||
            (message.relevantFiles && message.relevantFiles.length > 0)) && (
            <div className="w-full">
              <button
                onClick={() => setEvidenceOpen((o) => !o)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
              >
                <ConfidenceIcon className={`w-3.5 h-3.5 ${confidenceColor}`} />
                {message.confidence && (
                  <span className={`font-medium capitalize ${confidenceColor}`}>
                    {message.confidence} confidence
                  </span>
                )}
                {message.relevantFiles && message.relevantFiles.length > 0 && (
                  <span>
                    · {message.relevantFiles.length} file
                    {message.relevantFiles.length !== 1 ? "s" : ""}
                  </span>
                )}
                {evidenceOpen ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
              {evidenceOpen &&
                message.relevantFiles &&
                message.relevantFiles.length > 0 && (
                  <div className="mt-2 p-3 bg-bg-elevated border border-border-subtle rounded-xl">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Referenced Files
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {message.relevantFiles.map((file, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 px-2 py-1 bg-bg-secondary border border-border-subtle rounded-lg text-xs font-mono text-foreground/70 hover:border-accent-primary hover:text-accent-primary transition-colors"
                        >
                          <FileCode2 className="w-3 h-3 text-accent-primary flex-shrink-0" />
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
      </div>
    </div>
  );
});

// ─── Main Analyze Page ────────────────────────────────────────────────────────
function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  // State
  const [repoUrl, setRepoUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const [persona, setPersona] = useState<Persona>("new-dev");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStatus, setAnalyzeStatus] = useState("");
  const [deepScan, setDeepScan] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const contextId = searchParams?.get("contextId");
  const tabParam = searchParams?.get("tab");

  // Sync userId from session
  useEffect(() => {
    if (session?.user) {
      const userId =
        (session as { userId?: string }).userId ??
        (session.user as { id?: string }).id;
      if (userId) api.setUserId(userId);
    }
  }, [session]);

  // On mount: load contextId from URL or localStorage
  useEffect(() => {
    const savedId =
      typeof window !== "undefined"
        ? localStorage.getItem("lastContextId")
        : null;
    const id = contextId ?? savedId;
    if (id) {
      loadAnalysis(id);
    }
    if (tabParam) setActiveTab(tabParam);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When URL contextId changes
  useEffect(() => {
    if (contextId) {
      loadAnalysis(contextId);
      if (tabParam) setActiveTab(tabParam);
    }
  }, [contextId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load history for authenticated users
  useEffect(() => {
    if (session?.user) {
      api
        .listAnalyses()
        .then(setHistory)
        .catch(() => {});
    }
  }, [session]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadAnalysis = async (id: string) => {
    if (analysisData?.contextId === id) return;
    setLoadingAnalysis(true);
    setMessages([]); // clear stale messages before loading saved history
    setError("");
    try {
      const data = await api.getAnalysis(id);
      setAnalysisData(data);
      if (typeof window !== "undefined")
        localStorage.setItem("lastContextId", id);
      // Update URL without full navigation
      router.replace(`/analyze?contextId=${id}`, { scroll: false });
      // Load suggestions for chat
      api
        .getSuggestedQuestions(id)
        .then(setSuggestions)
        .catch(() => {});
      // Load persisted chat messages for this analysis
      api
        .getChatHistory(id)
        .then((saved) => {
          if (saved && saved.length > 0) {
            setMessages(
              saved.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                relevantFiles: m.relevant_files ?? [],
                confidence:
                  (m.confidence as ChatMessage["confidence"]) ?? undefined,
              })),
            );
          }
        })
        .catch(() => {});
    } catch {
      setError("Could not load analysis. It may have expired.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = repoUrl.trim();
    if (!url) return;
    setAnalyzing(true);
    setError("");
    setAnalysisData(null);
    setMessages([]);
    setSuggestions([]);
    setAnalyzeProgress(10);
    setAnalyzeStatus("Fetching repository metadata...");

    try {
      // Simulate progress steps
      const progressInterval = setInterval(() => {
        setAnalyzeProgress((p) => {
          if (p < 80) {
            const steps = [
              [20, "Scanning file structure..."],
              [40, "Analyzing tech stack..."],
              [60, "Running AI analysis..."],
              [75, "Generating insights..."],
            ];
            const next = steps.find(([threshold]) => p < (threshold as number));
            if (next) setAnalyzeStatus(next[1] as string);
            return Math.min(p + 8, 80);
          }
          return p;
        });
      }, 600);

      const result = await api.analyzeRepository(url, undefined, deepScan);
      clearInterval(progressInterval);
      setAnalyzeProgress(100);
      setAnalyzeStatus("Done!");

      const id = result.contextId;
      if (id) {
        if (typeof window !== "undefined")
          localStorage.setItem("lastContextId", id);
        router.replace(`/analyze?contextId=${id}`, { scroll: false });
        await loadAnalysis(id);
        setActiveTab("summary");
        if (session?.user) {
          api
            .listAnalyses()
            .then(setHistory)
            .catch(() => {});
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed. Please try again.",
      );
      setAnalyzeProgress(0);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const content = (text ?? chatInput).trim();
    if (!content || !analysisData?.contextId || chatLoading) return;
    setChatInput("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    const streamingId = (Date.now() + 1).toString();
    const streamingMsg: ChatMessage = {
      id: streamingId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };
    setMessages((prev) => [...prev, streamingMsg]);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date().toISOString(),
      }));

      const meta = await api.streamChatMessage(
        analysisData.contextId,
        content,
        history,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingId ? { ...m, content: m.content + chunk } : m,
            ),
          );
        },
      );

      // Finalise with metadata
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId
            ? {
                ...m,
                isStreaming: false,
                relevantFiles: meta.relevantFiles,
                confidence: meta.confidence,
              }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId
            ? {
                ...m,
                isStreaming: false,
                content:
                  m.content.length > 0
                    ? m.content
                    : "Sorry, I encountered an error. Please try again.",
              }
            : m,
        ),
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleExportHandoff = () => {
    if (!analysisData) return;
    const md = generateHandoffMd(analysisData);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysisData.metadata.name}-handoff.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Folder upload success handler
  const handleFolderUploadSuccess = useCallback(
    (contextId: string) => {
      setShowUploadModal(false);
      setMessages([]);
      setSuggestions([]);
      loadAnalysis(contextId);
      setActiveTab("summary");
      if (session?.user) {
        api
          .listAnalyses()
          .then(setHistory)
          .catch(() => {});
      }
    },
    [session], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const m = analysisData?.metrics;
  // Memoised chart data to avoid recomputing on every render
  const langData = useMemo(
    () =>
      m?.languageBreakdown
        ? m.languageBreakdown.map((l) => ({
            name: l.lang,
            percentage: l.percent,
          }))
        : (analysisData?.techStack.languages ?? []).map((l) => ({
            name: l,
            percentage: Math.floor(
              100 / Math.max(1, analysisData?.techStack.languages.length ?? 1),
            ),
          })),
    [m, analysisData?.techStack.languages],
  );

  const impactData = useMemo(
    () =>
      m?.onboardingImpact?.map((d) => ({
        task: d.stage,
        // Backend stores values in minutes; convert to hours (1 decimal)
        before: Math.round((d.before / 60) * 10) / 10,
        after: Math.round((d.after / 60) * 10) / 10,
      })) ?? [],
    [m],
  );

  return (
    <>
      {showUploadModal && (
        <FolderUploadModal
          onSuccess={handleFolderUploadSuccess}
          onClose={() => setShowUploadModal(false)}
        />
      )}
      <div className="flex h-screen overflow-hidden bg-bg-primary pt-14">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-64 flex-shrink-0 border-r border-border-subtle flex flex-col overflow-hidden bg-bg-secondary">
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            {/* Repo input */}
            <div className="space-y-2">
              <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Analyze Repository
              </h2>
              <form onSubmit={handleAnalyze} className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="github.com/owner/repo"
                    className="w-full pl-9 pr-3 py-2.5 bg-bg-elevated border border-border-subtle rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={analyzing || !repoUrl.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background rounded-xl text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" /> Analyze
                    </>
                  )}
                </button>
              </form>

              {/* Deep scan toggle */}
              <button
                type="button"
                onClick={() => setDeepScan((d) => !d)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  deepScan
                    ? "bg-accent-primary/10 border-accent-primary/40 text-accent-primary"
                    : "bg-bg-elevated border-border-subtle text-muted-foreground hover:text-foreground hover:border-border-subtle/70"
                }`}
              >
                <span
                  className={`w-7 h-4 rounded-full flex items-center transition-colors flex-shrink-0 ${deepScan ? "bg-accent-primary" : "bg-border-subtle"}`}
                >
                  <span
                    className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${deepScan ? "translate-x-3.5" : "translate-x-0.5"}`}
                  />
                </span>
                <span className="flex-1 text-left">Deep Scan</span>
                {deepScan && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent-primary/20 text-accent-primary font-semibold">
                    ~300 files
                  </span>
                )}
              </button>

              {/* Progress bar during analysis */}
              {analyzing && (
                <div className="space-y-1.5 px-0.5">
                  <Progress value={analyzeProgress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {analyzeStatus}
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Upload local folder */}
            <div>
              <button
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border-subtle text-muted-foreground hover:border-accent-primary/40 hover:text-foreground text-sm transition-all"
                onClick={() => setShowUploadModal(true)}
              >
                <FolderOpen className="w-4 h-4" />
                Upload Local Folder
              </button>
            </div>

            {/* Export Handoff Pack */}
            {analysisData && (
              <button
                onClick={handleExportHandoff}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary hover:bg-accent-primary/15 text-sm font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                Export Handoff Pack
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            )}

            <Separator />

            {/* History */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Analyses
                </h3>
                {history.length > 0 && (
                  <History className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>

              {!session?.user ? (
                <div className="p-3 bg-bg-elevated rounded-xl border border-dashed border-border-subtle space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Sign in to save and view history
                  </p>
                  <button
                    onClick={() =>
                      signIn("github", { callbackUrl: "/analyze" })
                    }
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-foreground/10 hover:bg-foreground/15 border border-border-subtle rounded-lg text-xs font-medium text-foreground transition-all"
                  >
                    <Github className="w-3.5 h-3.5" />
                    Sign in with GitHub
                  </button>
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">
                  No analyses yet
                </p>
              ) : (
                <ul className="space-y-1">
                  {history.slice(0, 10).map((item) => (
                    <li key={item.contextId}>
                      <button
                        onClick={() => loadAnalysis(item.contextId)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all group ${
                          analysisData?.contextId === item.contextId
                            ? "bg-accent-primary/10 border border-accent-primary/20 text-accent-primary"
                            : "hover:bg-bg-elevated text-foreground/70 hover:text-foreground"
                        }`}
                      >
                        <p className="font-medium truncate">
                          {item.repoUrl.replace("https://github.com/", "")}
                        </p>
                        <p className="text-muted-foreground text-[10px] mt-0.5">
                          {new Date(item.analyzedAt).toLocaleDateString()}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Guest nudge when analysis loaded but not signed in */}
            {analysisData && !session?.user && (
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
                <p className="text-xs text-amber-400 font-medium">
                  Save this analysis
                </p>
                <p className="text-xs text-muted-foreground">
                  Sign in to persist history across sessions
                </p>
                <button
                  onClick={() =>
                    signIn("github", {
                      callbackUrl: `/analyze?contextId=${analysisData.contextId}`,
                    })
                  }
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 rounded-lg text-xs font-medium text-amber-400 transition-all"
                >
                  <Github className="w-3.5 h-3.5" />
                  Sign in to save
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── RIGHT PANEL ── */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {loadingAnalysis ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Skeleton header bar */}
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-bg-secondary animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="w-36 h-3.5 rounded bg-bg-secondary animate-pulse" />
                    <div className="w-24 h-2.5 rounded bg-bg-secondary animate-pulse" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-12 h-5 rounded bg-bg-secondary animate-pulse" />
                  <div className="w-12 h-5 rounded bg-bg-secondary animate-pulse" />
                </div>
              </div>
              {/* Skeleton summary cards row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-bg-secondary border border-border-subtle space-y-2 animate-pulse"
                  >
                    <div className="w-16 h-2.5 rounded bg-muted" />
                    <div className="w-10 h-5 rounded bg-muted" />
                  </div>
                ))}
              </div>
              {/* Skeleton summary card */}
              <div className="rounded-xl bg-bg-secondary border border-border-subtle p-4 space-y-3 animate-pulse">
                <div className="w-28 h-3 rounded bg-muted" />
                <div className="space-y-2">
                  <div className="w-full h-2.5 rounded bg-muted" />
                  <div className="w-5/6 h-2.5 rounded bg-muted" />
                  <div className="w-4/6 h-2.5 rounded bg-muted" />
                </div>
              </div>
              {/* Skeleton tech stack + setup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-bg-secondary border border-border-subtle p-4 space-y-3 animate-pulse"
                  >
                    <div className="w-24 h-3 rounded bg-muted" />
                    <div className="flex flex-wrap gap-2">
                      {[...Array(4)].map((_, j) => (
                        <div
                          key={j}
                          className="w-14 h-5 rounded-full bg-muted"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Skeleton setup steps */}
              <div className="rounded-xl bg-bg-secondary border border-border-subtle p-4 space-y-3 animate-pulse">
                <div className="w-20 h-3 rounded bg-muted" />
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="w-full h-2.5 rounded bg-muted" />
                      <div className="w-3/4 h-2 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !analysisData ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
                <GitBranch className="w-10 h-10 text-accent-primary/60" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">
                  Analyze a Repository
                </h2>
                <p className="text-muted-foreground max-w-sm text-sm">
                  Paste a GitHub URL in the sidebar to instantly understand any
                  codebase — architecture, setup steps, and AI Q&A.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {["facebook/react", "vercel/next.js", "microsoft/vscode"].map(
                  (repo) => (
                    <button
                      key={repo}
                      onClick={() => setRepoUrl(`https://github.com/${repo}`)}
                      className="px-3 py-1.5 bg-bg-secondary border border-border-subtle rounded-full text-xs text-muted-foreground hover:text-foreground hover:border-border transition-all"
                    >
                      {repo}
                    </button>
                  ),
                )}
              </div>
            </div>
          ) : (
            /* Analysis loaded */
            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 overflow-hidden flex flex-col"
              >
                {/* Repo header bar + tab nav */}
                <div className="flex-shrink-0 bg-bg-primary/90 backdrop-blur-xl border-b border-border-subtle">
                  <div className="px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileCode className="w-4 h-4 text-accent-primary" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="font-semibold text-foreground truncate text-sm">
                          {analysisData.metadata.name}
                        </h1>
                        <p className="text-xs text-muted-foreground truncate">
                          {analysisData.metadata.fullName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        {analysisData.metadata.stars.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <GitFork className="w-3.5 h-3.5" />
                        {analysisData.metadata.forks.toLocaleString()}
                      </span>
                      {analysisData.metadata.language && (
                        <Badge variant="secondary" className="text-xs">
                          {analysisData.metadata.language}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* Tab navigation */}
                  <div className="px-4 sm:px-6 border-b border-border-subtle">
                    <div className="flex">
                      {(
                        [
                          {
                            value: "summary",
                            icon: <BarChart2 className="w-3.5 h-3.5" />,
                            label: "Summary",
                          },
                          {
                            value: "setup",
                            icon: <Zap className="w-3.5 h-3.5" />,
                            label: "Setup",
                          },
                          {
                            value: "architecture",
                            icon: <Package className="w-3.5 h-3.5" />,
                            label: "Architecture",
                          },
                          {
                            value: "chat",
                            icon: <Bot className="w-3.5 h-3.5" />,
                            label: "Chat",
                            badge: "AI",
                          },
                        ] as {
                          value: string;
                          icon: React.ReactNode;
                          label: string;
                          badge?: string;
                        }[]
                      ).map((tab) => (
                        <button
                          key={tab.value}
                          onClick={() => setActiveTab(tab.value)}
                          className={`relative flex items-center gap-1.5 px-3.5 pb-2.5 pt-1.5 text-xs font-medium transition-colors ${
                            activeTab === tab.value
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tab.icon}
                          {tab.label}
                          {tab.badge && (
                            <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-accent-primary/15 text-accent-primary leading-none">
                              {tab.badge}
                            </span>
                          )}
                          {activeTab === tab.value && (
                            <span className="absolute bottom-0 inset-x-0 h-[2px] rounded-t-full bg-accent-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* ── PERSONA SELECTOR ── */}
                <div className="flex-shrink-0 px-4 sm:px-6 py-2.5 flex items-center gap-3 bg-bg-primary/60 border-b border-border-subtle">
                  <span className="text-[11px] font-medium text-muted-foreground flex-shrink-0 uppercase tracking-wider">
                    View as
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      Object.entries(PERSONA_INFO) as [
                        Persona,
                        (typeof PERSONA_INFO)[Persona],
                      ][]
                    ).map(([id, p]) => (
                      <button
                        key={id}
                        onClick={() => {
                          setPersona(id);
                        }}
                        className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
                          persona === id
                            ? `${p.badgeBg} ${p.badgeBorder} ${p.textColor}`
                            : "bg-transparent border-border-subtle text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Scrollable tab content */}
                <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
                  {/* ── SUMMARY TAB ── */}
                  <TabsContent
                    value="summary"
                    className="space-y-5 mt-0 max-w-3xl mx-auto"
                  >
                    {/* KPI row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <MetricPill
                        icon={Star}
                        label="Stars"
                        value={analysisData.metadata.stars.toLocaleString()}
                      />
                      <MetricPill
                        icon={GitFork}
                        label="Forks"
                        value={analysisData.metadata.forks.toLocaleString()}
                      />
                      <MetricPill
                        icon={FileCode}
                        label="Language"
                        value={analysisData.metadata.language || "Multiple"}
                      />
                      {m ? (
                        <div className="flex flex-col gap-2 p-4 rounded-xl bg-bg-secondary border border-border-subtle">
                          <p className="text-xs font-medium text-muted-foreground">
                            Readiness Score
                          </p>
                          <div className="flex items-center gap-3">
                            <ReadinessRing score={m.onboardingReadinessScore} />
                            <div>
                              <p
                                className={`text-sm font-semibold ${COMPLEXITY_COLOR[m.setupComplexity]}`}
                              >
                                {COMPLEXITY_LABEL[m.setupComplexity]}
                              </p>
                              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                                {m.totalFiles} files
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <MetricPill
                          icon={Layers}
                          label="Files"
                          value="—"
                          sub="not computed"
                        />
                      )}
                    </div>

                    {/* Summary + description */}
                    <Card className="bg-bg-secondary border border-border-subtle">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-accent-primary" />{" "}
                          Project Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ProseContent text={analysisData.summary} />
                        {analysisData.metadata.description && (
                          <div className="mt-3 p-3 bg-bg-elevated border border-border-subtle rounded-lg">
                            <p className="text-foreground/70 italic text-sm leading-6">
                              &ldquo;{analysisData.metadata.description}&rdquo;
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Tech stack */}
                    <Card className="bg-bg-secondary border border-border-subtle">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                          Technology Stack
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysisData.techStack.languages.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Languages
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {analysisData.techStack.languages.map(
                                (lang, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    style={{
                                      borderColor: LANG_COLORS[lang]
                                        ? `${LANG_COLORS[lang]}40`
                                        : undefined,
                                    }}
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                                      style={{
                                        backgroundColor:
                                          LANG_COLORS[lang] ?? "#888",
                                      }}
                                    />
                                    {lang}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                        {analysisData.techStack.frameworks.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Frameworks
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {analysisData.techStack.frameworks.map(
                                  (fw, i) => (
                                    <Badge
                                      key={i}
                                      variant="secondary"
                                      className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    >
                                      {fw}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>
                          </>
                        )}
                        {analysisData.techStack.tools.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Tools
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {analysisData.techStack.tools.map((tool, i) => (
                                  <Badge key={i} variant="outline">
                                    {tool}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* PM-only: Onboarding impact card */}
                    {persona === "pm" && m && (
                      <Card className="bg-bg-secondary border border-blue-500/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-400" />
                            Onboarding Impact
                            <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-xs ml-auto border">
                              PM View
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {/* Stage-by-stage breakdown */}
                          <div className="space-y-2">
                            {m.onboardingImpact.map((row) => {
                              const saved = row.before - row.after;
                              const pct = Math.round(
                                (saved / row.before) * 100,
                              );
                              return (
                                <div
                                  key={row.stage}
                                  className="flex items-center gap-3"
                                >
                                  <p className="text-xs text-muted-foreground w-28 flex-shrink-0">
                                    {row.stage}
                                  </p>
                                  <div className="flex-1 relative h-5 bg-bg-elevated rounded-full overflow-hidden">
                                    <div
                                      className="absolute inset-y-0 left-0 bg-red-500/30 rounded-full"
                                      style={{ width: "100%" }}
                                    />
                                    <div
                                      className="absolute inset-y-0 left-0 bg-emerald-500/60 rounded-full"
                                      style={{ width: `${100 - pct}%` }}
                                    />
                                  </div>
                                  <p className="text-xs font-mono text-emerald-400 w-16 text-right flex-shrink-0">
                                    {row.before}m → {row.after}m
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 p-2.5 bg-muted rounded-lg text-center">
                            <p className="text-sm font-semibold text-foreground">
                              {Math.round(
                                ((m.onboardingImpact.reduce(
                                  (s, r) => s + r.before,
                                  0,
                                ) -
                                  m.onboardingImpact.reduce(
                                    (s, r) => s + r.after,
                                    0,
                                  )) /
                                  m.onboardingImpact.reduce(
                                    (s, r) => s + r.before,
                                    0,
                                  )) *
                                  100,
                              )}
                              % faster onboarding
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Readiness score: {m.onboardingReadinessScore}/100
                              · {m.setupComplexity} complexity · {m.totalFiles}{" "}
                              files
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* MCP Integration card */}
                    <Card className="bg-bg-secondary border border-violet-500/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Plug className="w-4 h-4 text-violet-400" />
                          IDE Integration via MCP
                          <Badge className="bg-violet-500/15 text-violet-400 border border-violet-500/20 text-xs ml-auto">
                            New
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-foreground/70">
                          Use DevBoard directly in VS Code, Claude, or any
                          MCP-compatible IDE. Query this repo without leaving
                          your editor.
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            "analyze_repository",
                            "chat_with_repo",
                            "get_analysis",
                          ].map((tool) => (
                            <div
                              key={tool}
                              className="px-2.5 py-2 bg-violet-500/10 border border-violet-500/20 rounded-lg text-center"
                            >
                              <p className="text-xs font-mono text-violet-300 truncate">
                                {tool}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Add to VS Code / Claude Desktop
                          </p>
                          <pre className="bg-bg-elevated border border-border-subtle rounded-xl p-3 text-xs text-foreground/80 font-mono overflow-x-auto whitespace-pre">{`{
  "mcpServers": {
    "devboard": {
      "command": "node",
      "args": ["./mcp-server/build/index.js"],
      "env": { "BOB_API_URL": "http://localhost:5000/api" }
    }
  }
}`}</pre>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── SETUP TAB ── */}
                  <TabsContent
                    value="setup"
                    className="space-y-5 mt-0 max-w-3xl mx-auto"
                  >
                    {/* Persona-aware banner */}
                    <div
                      className={`p-3 rounded-xl border flex items-start gap-2.5 ${PERSONA_INFO[persona].badgeBg} ${PERSONA_INFO[persona].badgeBorder}`}
                    >
                      <Sparkles
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${PERSONA_INFO[persona].textColor}`}
                      />
                      <div>
                        <p
                          className={`text-xs font-semibold mb-0.5 ${PERSONA_INFO[persona].textColor}`}
                        >
                          {PERSONA_INFO[persona].label} mode —{" "}
                          {PERSONA_INFO[persona].description}
                        </p>
                        <p className="text-xs text-foreground/70">
                          {PERSONA_INFO[persona].setupBanner}
                        </p>
                      </div>
                    </div>

                    <Card className="bg-bg-secondary border border-border-subtle">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-500" /> Setup Guide
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="divide-y divide-border-subtle">
                          {analysisData.setupSteps.map((step, i) => {
                            const stripped = step
                              .replace(/^\d+\.\s*/, "")
                              .replace(/\*\*/g, "")
                              .trim();
                            const isHeaderOnly = stripped.endsWith(":");
                            return (
                              <div
                                key={i}
                                className="flex gap-3.5 py-3 first:pt-0 last:pb-0"
                              >
                                <div className="w-6 h-6 flex-shrink-0 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                                  {i + 1}
                                </div>
                                <div className="flex-1 text-sm text-foreground/75 leading-6">
                                  {isHeaderOnly ? (
                                    <>
                                      <strong className="text-foreground font-semibold">
                                        {stripped.slice(0, -1)}
                                      </strong>
                                      <span className="ml-2 text-muted-foreground italic text-xs">
                                        — see repository README
                                      </span>
                                    </>
                                  ) : (
                                    step
                                      .replace(/^\d+\.\s*/, "")
                                      .split(/\*\*([^*]+)\*\*/g)
                                      .map((part, j) =>
                                        j % 2 === 1 ? (
                                          <strong
                                            key={j}
                                            className="text-foreground font-semibold"
                                          >
                                            {part}
                                          </strong>
                                        ) : (
                                          <span key={j}>{part}</span>
                                        ),
                                      )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                    <FirstTaskPanel contextId={analysisData.contextId} />
                    <HotspotPanel contextId={analysisData.contextId} />
                  </TabsContent>

                  {/* ── ARCHITECTURE TAB ── */}
                  <TabsContent
                    value="architecture"
                    className="space-y-5 mt-0 max-w-3xl mx-auto"
                  >
                    {/* Dependency Graph */}
                    <Card className="bg-bg-secondary border border-border-subtle">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-accent-primary" />{" "}
                          Dependency Graph
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ArchitectureGraph contextId={analysisData.contextId} />
                      </CardContent>
                    </Card>

                    <Card className="bg-bg-secondary border border-border-subtle">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Package className="w-4 h-4 text-accent-primary" />{" "}
                          Architecture Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ProseContent text={analysisData.architecture} />
                      </CardContent>
                    </Card>

                    {/* Key files */}
                    {Object.keys(analysisData.keyFiles ?? {}).filter(
                      (k) => (analysisData.keyFiles ?? {})[k],
                    ).length > 0 && (
                      <Card className="bg-bg-secondary border border-border-subtle">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-accent-primary" />{" "}
                            Key Files
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {Object.keys(analysisData.keyFiles ?? {})
                              .filter((k) => (analysisData.keyFiles ?? {})[k])
                              .map((file, i) => (
                                <span
                                  key={i}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated border border-border-subtle rounded-lg text-xs font-mono text-foreground/70"
                                >
                                  <FileCode2 className="w-3 h-3 text-accent-primary" />
                                  {file}
                                </span>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Scripts */}
                    {analysisData.scripts &&
                      Object.keys(analysisData.scripts).length > 0 && (
                        <Card className="bg-bg-secondary border border-border-subtle">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <Zap className="w-4 h-4 text-amber-500" />{" "}
                              Available Scripts
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {Object.entries(analysisData.scripts).map(
                                ([name, cmd], i) => (
                                  <div
                                    key={i}
                                    className="flex items-start gap-3 p-2.5 rounded-lg bg-bg-elevated border border-border-subtle"
                                  >
                                    <code className="text-xs font-mono text-accent-primary font-semibold w-28 flex-shrink-0 pt-0.5">
                                      {name}
                                    </code>
                                    <code className="text-xs font-mono text-foreground/60 break-all">
                                      {cmd}
                                    </code>
                                  </div>
                                ),
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                    {langData && langData.length > 0 && (
                      <Card className="bg-bg-secondary border border-border-subtle">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Language Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4">
                            {/* Donut */}
                            <div
                              className="flex-shrink-0"
                              style={{ width: 150, height: 150 }}
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={langData}
                                    dataKey="percentage"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={42}
                                    outerRadius={65}
                                    strokeWidth={2}
                                    stroke="var(--bg-secondary)"
                                    paddingAngle={langData.length > 1 ? 3 : 0}
                                  >
                                    {langData.map((entry, i) => (
                                      <Cell
                                        key={i}
                                        fill={
                                          LANG_COLORS[entry.name] ??
                                          `hsl(${i * 47}, 60%, 55%)`
                                        }
                                      />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip
                                    formatter={(value) => [
                                      `${value}%`,
                                      "Share",
                                    ]}
                                    contentStyle={{
                                      background: "var(--bg-elevated)",
                                      border: "1px solid var(--border-subtle)",
                                      borderRadius: "8px",
                                      fontSize: "11px",
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            {/* Legend list */}
                            <ul className="flex-1 min-w-0 space-y-1.5">
                              {langData.map((d, i) => (
                                <li
                                  key={i}
                                  className="flex items-center gap-2 text-xs min-w-0"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{
                                      background:
                                        LANG_COLORS[d.name] ??
                                        `hsl(${i * 47}, 60%, 55%)`,
                                    }}
                                  />
                                  <span className="truncate text-foreground/70 flex-1">
                                    {d.name}
                                  </span>
                                  <span className="font-semibold text-foreground tabular-nums">
                                    {d.percentage}%
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {impactData.length > 0 && (
                      <Card className="bg-bg-secondary border border-border-subtle">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Onboarding Time Saved
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div style={{ height: 210 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={impactData}
                                margin={{
                                  top: 4,
                                  right: 8,
                                  left: -16,
                                  bottom: 0,
                                }}
                                barCategoryGap="30%"
                                barGap={3}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="rgba(255,255,255,0.05)"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="task"
                                  tick={{
                                    fontSize: 10,
                                    fill: "var(--muted-foreground)",
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{
                                    fontSize: 10,
                                    fill: "var(--muted-foreground)",
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                  tickFormatter={(v) => `${v}h`}
                                />
                                <RechartsTooltip
                                  formatter={(value, name) => [
                                    `${Number(value)}h`,
                                    String(name ?? ""),
                                  ]}
                                  contentStyle={{
                                    background: "var(--bg-elevated)",
                                    border: "1px solid var(--border-subtle)",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                  }}
                                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                                />
                                <RechartsLegend
                                  iconType="circle"
                                  iconSize={7}
                                  wrapperStyle={{
                                    fontSize: "10px",
                                    paddingTop: "6px",
                                  }}
                                />
                                <Bar
                                  dataKey="before"
                                  fill="rgba(100,116,139,0.35)"
                                  name="Without DevBoard"
                                  radius={[3, 3, 0, 0]}
                                />
                                <Bar
                                  dataKey="after"
                                  fill="var(--accent-primary)"
                                  name="With DevBoard"
                                  radius={[3, 3, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* ── CHAT TAB ── */}
                  <TabsContent value="chat" className="mt-0">
                    <div className="flex flex-col h-[calc(100vh-248px)] min-h-[400px]">
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto space-y-4 p-1 pb-4">
                        {messages.length === 0 ? (
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-violet-400" />
                              </div>
                              <div className="bg-bg-secondary border border-border-subtle rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-foreground/80 max-w-md">
                                Hi! I've analyzed{" "}
                                <strong>{analysisData.metadata.name}</strong>.{" "}
                                {persona === "new-dev" &&
                                  "Ask me anything about setup, architecture, or how to make your first contribution."}
                                {persona === "tech-lead" &&
                                  "Ask me about architecture decisions, hotspots, technical debt, or codebase risks."}
                                {persona === "pm" &&
                                  "Ask me about project scope, team onboarding cost, complexity, or delivery timeline."}
                                {persona === "contributor" &&
                                  "Ask me about good first issues, entry points, contribution areas, or code conventions."}
                              </div>
                            </div>
                            {suggestions.length > 0 && (
                              <div className="space-y-2 pl-11">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> Suggested
                                  Questions
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {suggestions.slice(0, 4).map((q, i) => (
                                    <button
                                      key={i}
                                      onClick={() => handleSendMessage(q)}
                                      className="text-left px-3 py-2 rounded-xl bg-bg-secondary border border-border-subtle text-xs text-foreground/70 hover:text-foreground hover:border-accent-primary/40 hover:bg-accent-primary/5 transition-all leading-relaxed"
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Chat input */}
                      <div className="border-t border-border-subtle pt-3">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                          }}
                          className="flex gap-2"
                        >
                          <input
                            ref={inputRef}
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={PERSONA_INFO[persona].chatHint}
                            disabled={chatLoading}
                            className="flex-1 px-4 py-2.5 bg-bg-secondary border border-border-subtle rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50 transition-all disabled:opacity-50"
                          />
                          <button
                            type="submit"
                            disabled={chatLoading || !chatInput.trim()}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-foreground text-background rounded-xl text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {chatLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}
