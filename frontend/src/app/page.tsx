'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Github, Sparkles, ArrowRight } from 'lucide-react'

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validate GitHub URL
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/
    if (!githubRegex.test(repoUrl)) {
      setError('Please enter a valid GitHub repository URL')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze repository')
      }

      const data = await response.json()
      router.push(`/dashboard?contextId=${data.contextId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Developer Onboarding
          </h1>
          <p className="text-xl text-gray-600">
            Understand any GitHub repository in seconds with AI-powered analysis
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Powered by</span>
            <span className="font-semibold text-blue-600">IBM watsonx</span>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div>
              <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Repository URL
              </label>
              <div className="relative">
                <Github className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="repoUrl"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !repoUrl}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing Repository...
                </>
              ) : (
                <>
                  Analyze Repository
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-4">What you'll get:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Instant project summary and tech stack analysis</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Step-by-step setup instructions</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Architecture explanation and file structure</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Context-aware AI chatbot for repo-specific questions</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Example */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Try with:{' '}
            <button
              onClick={() => setRepoUrl('https://github.com/vercel/next.js')}
              className="text-blue-600 hover:underline font-medium"
            >
              https://github.com/vercel/next.js
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}

// Made with Bob
