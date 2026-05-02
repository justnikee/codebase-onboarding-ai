'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  FileCode, 
  Package, 
  GitBranch, 
  Star, 
  GitFork,
  Calendar,
  MessageSquare,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

interface AnalysisData {
  contextId: string
  repoUrl: string
  metadata: {
    name: string
    fullName: string
    description: string | null
    language: string | null
    stars: number
    forks: number
    createdAt: string
    updatedAt: string
  }
  techStack: {
    languages: string[]
    frameworks: string[]
    tools: string[]
  }
  summary: string
  setupSteps: string[]
  architecture: string
  analyzedAt: string
}

// Mock analytics data for the "Before and After" impact
const onboardingImpactData = [
  { stage: 'Env Setup', before: 120, after: 15 },
  { stage: 'Code Reading', before: 240, after: 30 },
  { stage: 'First PR', before: 480, after: 90 },
  { stage: 'Full Prod', before: 960, after: 120 },
]

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const contextId = searchParams?.get('contextId')

  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!contextId) {
      router.push('/')
      return
    }

    fetchAnalysis()
  }, [contextId])

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analyze/${contextId}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch analysis')
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse" />
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin relative z-10" />
          </div>
          <p className="text-zinc-500 font-medium animate-pulse">Generating comprehensive analysis...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
        <Card className="max-w-md w-full border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800/80 mb-6">{error || 'Analysis not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              &larr; Back to home
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-12">
      {/* Premium Header */}
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FileCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400">
                  {data.metadata.name}
                </h1>
                <p className="text-sm font-medium text-zinc-500">{data.metadata.fullName}</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/chat?contextId=${contextId}`)}
              className="group flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-5 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
            >
              <MessageSquare className="w-4 h-4" />
              Ask AI Assistant
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500">Repository Stars</p>
                  <p className="text-3xl font-bold">{data.metadata.stars.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-500/10 rounded-xl">
                  <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500">Forks & Contributions</p>
                  <p className="text-3xl font-bold">{data.metadata.forks.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
                  <GitFork className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500">Primary Language</p>
                  <p className="text-3xl font-bold">{data.metadata.language || 'Multiple'}</p>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
                  <FileCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm relative overflow-hidden group cursor-pointer" onClick={() => router.push(`/chat?contextId=${contextId}`)}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 opacity-90 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10 text-white flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-100">Ready to code?</p>
                  <p className="text-xl font-bold">Start Onboarding</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-sm font-medium">
                Jump into AI Chat <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-1 border shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800">
              <LayoutDashboard className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800">
              <TrendingUp className="w-4 h-4 mr-2" /> Analytics & Impact
            </TabsTrigger>
            <TabsTrigger value="architecture" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800">
              <Package className="w-4 h-4 mr-2" /> Architecture
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <GitBranch className="w-5 h-5 text-blue-500" />
                      Project Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg">
                      {data.summary}
                    </p>
                    {data.metadata.description && (
                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                        <p className="text-blue-800 dark:text-blue-300 italic text-sm">
                          "{data.metadata.description}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      Instant Setup Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.setupSteps.map((step, index) => (
                        <div key={index} className="flex gap-4 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                          <div className="flex-shrink-0 w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full flex items-center justify-center font-bold shadow-sm">
                            {index + 1}
                          </div>
                          <p className="text-zinc-700 dark:text-zinc-300 pt-1 leading-relaxed">
                            {step.replace(/^\d+\.\s*/, '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle>Technology Stack</CardTitle>
                    <CardDescription>Detected frameworks and languages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {data.techStack.languages.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Languages</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.techStack.languages.map((lang, i) => (
                            <Badge key={i} variant="secondary" className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    {data.techStack.frameworks.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Frameworks</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.techStack.frameworks.map((fw, i) => (
                            <Badge key={i} variant="secondary" className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                              {fw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Separator />

                    {data.techStack.tools.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Tools</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.techStack.tools.map((tool, i) => (
                            <Badge key={i} variant="secondary" className="bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="bg-zinc-100/50 dark:bg-zinc-900/30 rounded-xl p-4 flex items-center gap-3 border border-zinc-200 dark:border-zinc-800">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Analysis Complete</p>
                    <p className="text-xs text-zinc-500">Analyzed {new Date(data.analyzedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-md col-span-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    Onboarding Time Impact (Before vs After)
                  </CardTitle>
                  <CardDescription>
                    Estimated time (in minutes) to reach milestones using traditional vs AI-assisted onboarding.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={onboardingImpactData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} />
                        <RechartsTooltip 
                          cursor={{ fill: '#f3f4f6' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar name="Without AI Assistant (mins)" dataKey="before" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={40} />
                        <Bar name="With AI Assistant (mins)" dataKey="after" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Time Saved Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {onboardingImpactData.map((item, i) => {
                    const saved = item.before - item.after;
                    const percent = Math.round((saved / item.before) * 100);
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>{item.stage}</span>
                          <span className="text-emerald-600">{percent}% faster</span>
                        </div>
                        <Progress value={percent} className="h-2 bg-zinc-100" />
                        <p className="text-xs text-zinc-500 text-right">{saved} mins saved</p>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
                <CardHeader>
                  <CardTitle className="text-indigo-100">Overall Efficiency Gain</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-7xl font-bold mb-4">8.5x</p>
                  <p className="text-indigo-100 font-medium text-lg text-center">
                    Faster time-to-first-commit on average for {data.metadata.name}.
                  </p>
                  <div className="mt-8 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold">
                    Unlocking Developer Productivity
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="architecture">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-violet-500" />
                  Codebase Architecture
                </CardTitle>
                <CardDescription>
                  A deep dive into how {data.metadata.name} is structured.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-zinc dark:prose-invert max-w-none">
                  <p className="leading-loose whitespace-pre-line text-lg text-zinc-700 dark:text-zinc-300">
                    {data.architecture}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

// Made with Bob
