/**
 * Core type definitions for the AI Onboarding Assistant
 */

// Repository Analysis Types
export interface RepoAnalysisRequest {
  repoUrl: string;
}

export interface RepoMetadata {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  stars: number;
  forks: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  content?: string;
  children?: FileInfo[];
}

export interface FileSummary {
  path: string;
  summary: string;
  keywords: string[];
  importance: 'high' | 'medium' | 'low';
}

export interface TechStack {
  languages: string[];
  frameworks: string[];
  tools: string[];
}

export interface RepositoryContext {
  contextId: string;
  repoUrl: string;
  metadata: RepoMetadata;
  techStack: TechStack;
  readme: string | null;
  files: FileSummary[];
  fileStructure: FileInfo[]; // Full file structure for advanced analysis
  keyFiles: Record<string, string | null>; // Key configuration files
  scripts: Record<string, string>;
  dependencies: {
    production: Record<string, string>;
    development: Record<string, string>;
  };
  summary: string;
  setupSteps: string[];
  architecture: string;
  analyzedAt: string;
}

// Chat Types
export interface ChatRequest {
  contextId: string;
  question: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  answer: string;
  relevantFiles: string[];
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
}

// IBM Watson Types
export interface WatsonXConfig {
  apiKey: string;
  projectId: string;
  url: string;
}

export interface WatsonXGenerationParams {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

export interface WatsonXResponse {
  generated_text: string;
  generated_token_count: number;
  input_token_count: number;
  stop_reason: string;
}

// GitHub API Types
export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

// Error Types
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class GitHubAPIError extends AppError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode, 'GITHUB_API_ERROR');
    this.name = 'GitHubAPIError';
  }
}

export class WatsonXError extends AppError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode, 'WATSONX_ERROR');
    this.name = 'WatsonXError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// Utility Types
export type AsyncResult<T> = Promise<{ success: true; data: T } | { success: false; error: string }>;

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Made with Bob
