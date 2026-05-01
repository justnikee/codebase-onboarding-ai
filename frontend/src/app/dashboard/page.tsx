'use client'

import { useEffect, useState } from 'react'
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
  CheckCircle2
} from 'lucide-react'

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

export default function Dashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const contextId = searchParams.get('contextId')

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error || 'Analysis not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 hover:underline"
          >
            ← Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.metadata.name}</h1>
              <p className="text-sm text-gray-500">{data.metadata.fullName}</p>
            </div>
            <button
              onClick={() => router.push(`/chat?contextId=${contextId}`)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <MessageSquare className="w-4 h-4" />
              Ask Questions
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Repository Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Star className="w-5 h-5 text-yellow-500" />}
            label="Stars"
            value={data.metadata.stars.toLocaleString()}
          />
          <StatCard
            icon={<GitFork className="w-5 h-5 text-blue-500" />}
            label="Forks"
            value={data.metadata.forks.toLocaleString()}
          />
          <StatCard
            icon={<FileCode className="w-5 h-5 text-green-500" />}
            label="Language"
            value={data.metadata.language || 'Multiple'}
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-purple-500" />}
            label="Updated"
            value={new Date(data.metadata.updatedAt).toLocaleDateString()}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Summary */}
            <Section title="Project Summary" icon={<GitBranch />}>
              <p className="text-gray-700 leading-relaxed">{data.summary}</p>
              {data.metadata.description && (
                <p className="text-gray-600 text-sm mt-3 italic">
                  "{data.metadata.description}"
                </p>
              )}
            </Section>

            {/* Setup Instructions */}
            <Section title="Setup Instructions" icon={<Package />}>
              <ol className="space-y-3">
                {data.setupSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 pt-0.5">{step.replace(/^\d+\.\s*/, '')}</span>
                  </li>
                ))}
              </ol>
            </Section>

            {/* Architecture */}
            <Section title="Architecture Overview" icon={<FileCode />}>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {data.architecture}
              </p>
            </Section>
          </div>

          {/* Right Column - Tech Stack */}
          <div className="space-y-6">
            {/* Tech Stack */}
            <Section title="Tech Stack" icon={<Package />}>
              <div className="space-y-4">
                {data.techStack.languages.length > 0 && (
                  <TechStackGroup
                    title="Languages"
                    items={data.techStack.languages}
                    color="blue"
                  />
                )}
                {data.techStack.frameworks.length > 0 && (
                  <TechStackGroup
                    title="Frameworks"
                    items={data.techStack.frameworks}
                    color="green"
                  />
                )}
                {data.techStack.tools.length > 0 && (
                  <TechStackGroup
                    title="Tools"
                    items={data.techStack.tools}
                    color="purple"
                  />
                )}
              </div>
            </Section>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <ActionButton
                  onClick={() => router.push(`/chat?contextId=${contextId}`)}
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="Ask Questions"
                />
                <ActionButton
                  onClick={() => window.open(data.repoUrl, '_blank')}
                  icon={<GitBranch className="w-4 h-4" />}
                  label="View on GitHub"
                />
                <ActionButton
                  onClick={() => router.push('/')}
                  icon={<ArrowRight className="w-4 h-4" />}
                  label="Analyze Another Repo"
                />
              </div>
            </div>

            {/* Analysis Info */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="font-medium text-gray-900">Analysis Complete</span>
              </div>
              <p>Analyzed on {new Date(data.analyzedAt).toLocaleString()}</p>
              <p className="text-xs mt-2">Context ID: {data.contextId}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Helper Components
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function TechStackGroup({ title, items, color }: { title: string; items: string[]; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className={`px-3 py-1 rounded-full text-sm font-medium ${colorClasses[color as keyof typeof colorClasses]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function ActionButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition text-left"
    >
      {icon}
      <span className="text-gray-700">{label}</span>
    </button>
  )
}

// Made with Bob
