/**
 * API Client Service
 * Centralized API calls to backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      const data: ApiResponse<T> = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || data.message || 'Request failed')
      }

      return data.data as T
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred')
    }
  }

  /**
   * Analyze a GitHub repository
   */
  async analyzeRepository(repoUrl: string) {
    return this.fetch<{
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
    }>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ repoUrl }),
    })
  }

  /**
   * Get analysis by context ID
   */
  async getAnalysis(contextId: string) {
    return this.fetch<{
      contextId: string
      repoUrl: string
      metadata: {
        name: string
        fullName: string
        description: string | null
        defaultBranch: string
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
      readme: string | null
      scripts: Record<string, string>
      dependencies: {
        production: Record<string, string>
        development: Record<string, string>
      }
      analyzedAt: string
    }>(`/api/analyze/${contextId}`)
  }

  /**
   * List all analyzed repositories
   */
  async listAnalyses() {
    return this.fetch<Array<{
      contextId: string
      repoUrl: string
      analyzedAt: string
    }>>('/api/analyze')
  }

  /**
   * Delete an analysis
   */
  async deleteAnalysis(contextId: string) {
    return this.fetch<{ message: string }>(`/api/analyze/${contextId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Send a chat message
   */
  async sendChatMessage(
    contextId: string,
    question: string,
    conversationHistory?: Array<{
      role: 'user' | 'assistant'
      content: string
      timestamp: string
    }>
  ) {
    return this.fetch<{
      answer: string
      relevantFiles: string[]
      confidence: 'high' | 'medium' | 'low'
      sources: string[]
    }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        contextId,
        question,
        conversationHistory,
      }),
    })
  }

  /**
   * Get suggested questions for a repository
   */
  async getSuggestedQuestions(contextId: string) {
    return this.fetch<string[]>(`/api/chat/suggestions/${contextId}`)
  }

  /**
   * Check backend health
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL)

// Export types for use in components
export type {
  ApiResponse,
}

// Made with Bob
