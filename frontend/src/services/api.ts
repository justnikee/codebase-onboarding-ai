/**
 * API Client Service
 * Centralized API calls to backend
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private userId: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /** Call once after sign-in to attach the Supabase userId to all subsequent requests */
  setUserId(userId: string | null) {
    this.userId = userId;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const extraHeaders: Record<string, string> = {};
      if (this.userId) {
        extraHeaders["X-User-ID"] = this.userId;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...extraHeaders,
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const data: ApiResponse<T> = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || "Request failed");
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  /**
   * Analyze a GitHub repository
   */
  async analyzeRepository(
    repoUrl: string,
    githubToken?: string,
    deepScan?: boolean,
  ) {
    const headers: Record<string, string> = {};
    if (githubToken) {
      headers["Authorization"] = `Bearer ${githubToken}`;
    }

    return this.fetch<{
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
      };
      techStack: {
        languages: string[];
        frameworks: string[];
        tools: string[];
      };
      summary: string;
      setupSteps: string[];
      architecture: string;
      analyzedAt: string;
      metrics?: RepoMetrics;
    }>("/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        repoUrl,
        ...(deepScan ? { deepScan: true } : {}),
      }),
      headers,
    });
  }

  /**
   * Get analysis by context ID
   */
  async getAnalysis(contextId: string) {
    return this.fetch<{
      contextId: string;
      repoUrl: string;
      metadata: {
        name: string;
        fullName: string;
        description: string | null;
        defaultBranch: string;
        language: string | null;
        stars: number;
        forks: number;
        createdAt: string;
        updatedAt: string;
      };
      techStack: {
        languages: string[];
        frameworks: string[];
        tools: string[];
      };
      summary: string;
      setupSteps: string[];
      architecture: string;
      readme: string | null;
      scripts: Record<string, string>;
      dependencies: {
        production: Record<string, string>;
        development: Record<string, string>;
      };
      analyzedAt: string;
      metrics?: RepoMetrics;
    }>(`/api/analyze/${contextId}`);
  }

  /**
   * List all analyzed repositories
   */
  async listAnalyses() {
    return this.fetch<
      Array<{
        contextId: string;
        repoUrl: string;
        analyzedAt: string;
      }>
    >("/api/analyze");
  }

  /**
   * Delete an analysis
   */
  async deleteAnalysis(contextId: string) {
    return this.fetch<{ message: string }>(`/api/analyze/${contextId}`, {
      method: "DELETE",
    });
  }

  /**
   * Send a chat message
   */
  async sendChatMessage(
    contextId: string,
    question: string,
    conversationHistory?: Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: string;
    }>,
  ) {
    return this.fetch<{
      answer: string;
      relevantFiles: string[];
      confidence: "high" | "medium" | "low";
      sources: string[];
    }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        contextId,
        question,
        conversationHistory,
      }),
    });
  }

  /**
   * Stream a chat response via SSE.
   * Calls onChunk for each text chunk; resolves with metadata when done.
   */
  async streamChatMessage(
    contextId: string,
    question: string,
    conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: string;
    }>,
    onChunk: (chunk: string) => void,
  ): Promise<{
    relevantFiles: string[];
    confidence: "high" | "medium" | "low";
  }> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.userId) headers["X-User-ID"] = this.userId;

    const response = await fetch(`${this.baseUrl}/api/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({ contextId, question, conversationHistory }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let meta: {
      relevantFiles: string[];
      confidence: "high" | "medium" | "low";
    } = {
      relevantFiles: [],
      confidence: "medium",
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") return meta;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.text) onChunk(parsed.text);
          if (parsed.meta) meta = parsed.meta;
          if (parsed.error) throw new Error(parsed.error);
        } catch (e) {
          if (e instanceof SyntaxError) continue; // malformed chunk, skip
          throw e;
        }
      }
    }
    return meta;
  }

  /**
   * Get suggested questions for a repository
   */
  async getSuggestedQuestions(contextId: string) {
    return this.fetch<string[]>(`/api/chat/suggestions/${contextId}`);
  }

  /**
   * Check backend health
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get the current user's analysis history
   */
  async getHistory() {
    return this.fetch<
      Array<{
        id: string;
        repo_url: string;
        repo_full_name: string | null;
        context_id: string;
        status: string;
        summary_snapshot: string | null;
        readiness_score: number | null;
        created_at: string;
        completed_at: string | null;
      }>
    >("/api/history");
  }

  /**
   * Get persisted chat messages for a prior analysis
   */
  async getChatHistory(contextId: string) {
    return this.fetch<
      Array<{
        id: string;
        role: "user" | "assistant";
        content: string;
        relevant_files: string[];
        confidence: string | null;
        created_at: string;
      }>
    >(`/api/history/${contextId}/chat`);
  }

  /**
   * Submit feedback for a chat answer or analysis
   */
  async submitFeedback(params: {
    userId: string;
    analysisId?: string;
    messageId?: string;
    rating?: number;
    helpful?: boolean;
    comment?: string;
  }) {
    return this.fetch<{ success: boolean }>("/api/auth/feedback", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Get AI-generated "first tasks" onboarding plan for a context
   */
  async getFirstTasks(contextId: string): Promise<FirstTaskPlan> {
    return this.fetch<FirstTaskPlan>(`/api/insights/${contextId}/first-tasks`);
  }

  /**
   * Get code quality metrics and hotspot analysis for a context
   */
  async getCodeInsights(contextId: string): Promise<CodeInsights> {
    return this.fetch<CodeInsights>(`/api/insights/${contextId}/code-metrics`);
  }

  /**
   * Get a real file-level dependency graph for the analyzed repo
   */
  async getGraph(contextId: string): Promise<GraphData> {
    return this.fetch<GraphData>(`/api/insights/${contextId}/graph`);
  }

  /**
   * Upload a local folder for analysis.
   * Uses XMLHttpRequest so we can report real upload progress via onProgress.
   * @param files      - File array (from showDirectoryPicker) or FileList
   * @param projectName - Folder/project name
   * @param onProgress - Optional callback with (percent 0-100, statusText)
   */
  uploadFolder(
    files: File[] | FileList,
    projectName: string,
    onProgress?: (progress: number, status: string) => void,
  ): Promise<{
    contextId: string;
    projectName: string;
    totalFiles: number;
    totalSize: number;
    projectType: string;
  }> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        // Preserve the directory structure using webkitRelativePath
        const relativePath =
          (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
          file.name;
        formData.append("files", file, relativePath);
      });
      formData.append("projectName", projectName);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${this.baseUrl}/api/upload/folder`);

      // Attach user-id header when available
      if (this.userId) {
        xhr.setRequestHeader("X-User-ID", this.userId);
      }

      // Upload progress: 0-50 % while bytes are in-flight
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const pct = Math.round((event.loaded / event.total) * 50);
          onProgress(pct, "Uploading files...");
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const body = JSON.parse(xhr.responseText) as {
              success: boolean;
              data?: {
                contextId: string;
                projectName: string;
                totalFiles: number;
                totalSize: number;
                projectType: string;
              };
              error?: string;
            };
            if (body.success && body.data) {
              resolve(body.data);
            } else {
              reject(new Error(body.error ?? "Upload failed"));
            }
          } catch {
            reject(new Error("Invalid response from server"));
          }
        } else {
          let msg = `Upload failed: HTTP ${xhr.status}`;
          try {
            const body = JSON.parse(xhr.responseText) as { error?: string };
            if (body.error) msg = body.error;
          } catch {
            /* ignore */
          }
          reject(new Error(msg));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.onabort = () => reject(new Error("Upload aborted"));

      xhr.send(formData);
    });
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export types for use in components
export type { ApiResponse };

export interface RepoMetrics {
  totalFiles: number;
  codeFiles: number;
  testFiles: number;
  configFiles: number;
  dependencyCount: number;
  prodDependencyCount: number;
  devDependencyCount: number;
  hasReadme: boolean;
  hasTests: boolean;
  hasCI: boolean;
  setupComplexity: "low" | "medium" | "high";
  setupStepsCount: number;
  onboardingReadinessScore: number;
  languageBreakdown: Array<{ lang: string; count: number; percent: number }>;
  onboardingImpact: Array<{ stage: string; before: number; after: number }>;
}

export interface FirstTaskPlan {
  filesToRead: string[];
  entryPoints: string[];
  starterTask: {
    title: string;
    description: string;
    files: string[];
    why: string;
  };
  learningPath: string[];
  quickWins: string[];
}

export interface CodeInsights {
  metrics: {
    complexity: "low" | "medium" | "high";
    maintainability: number;
    testCoverage: "none" | "partial" | "good" | "excellent";
    documentation: "poor" | "fair" | "good" | "excellent";
  };
  dependencies: {
    total: number;
    outdated: string[];
    security: { vulnerabilities: number; severity: string };
    licenses: string[];
  };
  patterns: Array<{
    pattern: string;
    confidence: number;
    description: string;
    files: string[];
  }>;
  smells: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    file: string;
    description: string;
    suggestion: string;
  }>;
  suggestions: string[];
}

export interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    path: string;
    community: number;
    size: number;
  }>;
  links: Array<{
    source: string;
    target: string;
  }>;
  communities: Array<{
    id: number;
    label: string;
    color: string;
  }>;
}

// Made with Bob
