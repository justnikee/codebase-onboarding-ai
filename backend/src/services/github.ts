/**
 * GitHub API Service
 * Handles all interactions with the GitHub API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  GitHubAPIError,
  RepoMetadata,
  FileInfo,
  GitHubFile,
  GitHubContent,
} from '../types/index.js';
import { parseGitHubUrl } from '../utils/validators.js';
import { retryWithBackoff, delay } from '../utils/helpers.js';

class GitHubService {
  private client: AxiosInstance;
  private rateLimitRemaining: number = 5000;
  private rateLimitReset: number = 0;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
      timeout: 30000, // 30 seconds
    });

    // Add response interceptor for rate limit tracking
    this.client.interceptors.response.use(
      (response) => {
        this.updateRateLimit(response.headers);
        return response;
      },
      (error) => {
        if (error.response) {
          this.updateRateLimit(error.response.headers);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Updates rate limit information from response headers
   */
  private updateRateLimit(headers: Record<string, string>): void {
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];

    if (remaining) this.rateLimitRemaining = parseInt(remaining, 10);
    if (reset) this.rateLimitReset = parseInt(reset, 10) * 1000;
  }

  /**
   * Checks if we're approaching rate limit and waits if necessary
   */
  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitRemaining < 10) {
      const now = Date.now();
      const waitTime = Math.max(0, this.rateLimitReset - now);

      if (waitTime > 0) {
        console.warn(
          `Approaching GitHub rate limit. Waiting ${Math.ceil(waitTime / 1000)}s...`
        );
        await delay(waitTime);
      }
    }
  }

  /**
   * Handles GitHub API errors
   */
  private handleError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const message = (axiosError.response?.data as any)?.message || axiosError.message;

      switch (status) {
        case 404:
          throw new GitHubAPIError(
            `Repository not found. Please check the URL and ensure the repository is public.`,
            404
          );
        case 403:
          if (message.includes('rate limit')) {
            throw new GitHubAPIError(
              'GitHub API rate limit exceeded. Please try again later or add a GitHub token.',
              429
            );
          }
          throw new GitHubAPIError(
            'Access forbidden. The repository might be private or require authentication.',
            403
          );
        case 401:
          throw new GitHubAPIError(
            'GitHub authentication failed. Please check your GitHub token.',
            401
          );
        default:
          throw new GitHubAPIError(
            `GitHub API error (${context}): ${message}`,
            status || 500
          );
      }
    }

    throw new GitHubAPIError(
      `Unexpected error while ${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }

  /**
   * Fetches repository metadata
   */
  async getRepoMetadata(repoUrl: string): Promise<RepoMetadata> {
    const { owner, repo } = parseGitHubUrl(repoUrl);

    try {
      await this.checkRateLimit();

      const response = await retryWithBackoff(
        () => this.client.get(`/repos/${owner}/${repo}`),
        3,
        1000
      );

      const data = response.data;

      return {
        owner: data.owner.login,
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        defaultBranch: data.default_branch,
        language: data.language,
        stars: data.stargazers_count,
        forks: data.forks_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      this.handleError(error, 'fetching repository metadata');
    }
  }

  /**
   * Fetches README content
   */
  async getReadme(repoUrl: string): Promise<string | null> {
    const { owner, repo } = parseGitHubUrl(repoUrl);

    try {
      await this.checkRateLimit();

      const response = await this.client.get(`/repos/${owner}/${repo}/readme`, {
        headers: {
          Accept: 'application/vnd.github.v3.raw',
        },
      });

      return response.data;
    } catch (error) {
      // README is optional, return null if not found
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      this.handleError(error, 'fetching README');
    }
  }

  /**
   * Fetches file content
   */
  async getFileContent(repoUrl: string, path: string): Promise<string | null> {
    const { owner, repo } = parseGitHubUrl(repoUrl);

    try {
      await this.checkRateLimit();

      const response = await this.client.get<GitHubContent>(
        `/repos/${owner}/${repo}/contents/${path}`
      );

      if (response.data.type !== 'file' || !response.data.content) {
        return null;
      }

      // Decode base64 content
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return content;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      console.warn(`Failed to fetch file ${path}:`, error);
      return null;
    }
  }

  /**
   * Lists files in a directory
   */
  async listDirectory(
    repoUrl: string,
    path: string = ''
  ): Promise<GitHubFile[]> {
    const { owner, repo } = parseGitHubUrl(repoUrl);

    try {
      await this.checkRateLimit();

      const response = await this.client.get<GitHubFile[]>(
        `/repos/${owner}/${repo}/contents/${path}`
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      this.handleError(error, `listing directory ${path}`);
    }
  }

  /**
   * Recursively fetches repository file structure
   * Limited to prevent excessive API calls
   */
  async getFileStructure(
    repoUrl: string,
    maxDepth: number = 3,
    maxFiles: number = 100
  ): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    const { owner, repo } = parseGitHubUrl(repoUrl);

    const traverse = async (path: string = '', depth: number = 0): Promise<void> => {
      if (depth > maxDepth || files.length >= maxFiles) {
        return;
      }

      try {
        const items = await this.listDirectory(repoUrl, path);

        for (const item of items) {
          if (files.length >= maxFiles) break;

          // Skip common directories to ignore
          const skipDirs = [
            'node_modules',
            '.git',
            'dist',
            'build',
            'coverage',
            '.next',
            '__pycache__',
            'venv',
            'vendor',
          ];

          if (item.type === 'dir' && skipDirs.includes(item.name)) {
            continue;
          }

          files.push({
            path: item.path,
            type: item.type,
            size: item.size,
          });

          // Recursively traverse directories
          if (item.type === 'dir') {
            await traverse(item.path, depth + 1);
          }
        }
      } catch (error) {
        console.warn(`Failed to traverse ${path}:`, error);
      }
    };

    await traverse();
    return files;
  }

  /**
   * Fetches key configuration files
   */
  async getKeyFiles(repoUrl: string): Promise<Record<string, string | null>> {
    const keyFiles = [
      'package.json',
      'requirements.txt',
      'setup.py',
      'Cargo.toml',
      'go.mod',
      'pom.xml',
      'build.gradle',
      'composer.json',
      'Gemfile',
      'Dockerfile',
      'docker-compose.yml',
      '.env.example',
    ];

    const results: Record<string, string | null> = {};

    // Fetch files in parallel with concurrency limit
    const chunkSize = 5;
    for (let i = 0; i < keyFiles.length; i += chunkSize) {
      const chunk = keyFiles.slice(i, i + chunkSize);
      const promises = chunk.map(async (file) => {
        const content = await this.getFileContent(repoUrl, file);
        return { file, content };
      });

      const chunkResults = await Promise.all(promises);
      chunkResults.forEach(({ file, content }) => {
        results[file] = content;
      });
    }

    return results;
  }

  /**
   * Gets current rate limit status
   */
  getRateLimitStatus(): { remaining: number; resetAt: Date } {
    return {
      remaining: this.rateLimitRemaining,
      resetAt: new Date(this.rateLimitReset),
    };
  }
}

// Export singleton instance
export const githubService = new GitHubService();

// Made with Bob
