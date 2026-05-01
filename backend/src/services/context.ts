/**
 * Context Service
 * Builds and manages repository context for AI-powered analysis
 */

import fs from 'fs/promises';
import path from 'path';
import {
  RepositoryContext,
  FileSummary,
  TechStack,
  FileInfo,
} from '../types/index.js';
import { githubService } from './github.js';
import { watsonxService } from './watsonx.js';
import {
  generateContextId,
  extractKeywords,
  getFileImportance,
  detectLanguage,
  formatDate,
  safeJsonParse,
} from '../utils/helpers.js';

class ContextService {
  private readonly storageDir = path.join(process.cwd(), 'src', 'storage', 'contexts');

  constructor() {
    this.ensureStorageDir();
  }

  /**
   * Ensures storage directory exists
   */
  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  /**
   * Builds complete repository context
   */
  async buildContext(repoUrl: string): Promise<RepositoryContext> {
    console.log(`Building context for ${repoUrl}...`);

    // Step 1: Fetch repository metadata
    console.log('Fetching repository metadata...');
    const metadata = await githubService.getRepoMetadata(repoUrl);

    // Step 2: Fetch README
    console.log('Fetching README...');
    const readme = await githubService.getReadme(repoUrl);

    // Step 3: Fetch key configuration files
    console.log('Fetching key files...');
    const keyFiles = await githubService.getKeyFiles(repoUrl);

    // Step 4: Get file structure
    console.log('Analyzing file structure...');
    const fileStructure = await githubService.getFileStructure(repoUrl, 3, 100);

    // Step 5: Detect tech stack
    console.log('Detecting tech stack...');
    const techStack = await this.detectTechStack(
      fileStructure,
      keyFiles['package.json'],
      keyFiles['requirements.txt']
    );

    // Step 6: Extract scripts and dependencies
    const { scripts, dependencies } = this.extractPackageInfo(keyFiles['package.json']);

    // Step 7: Generate file summaries for important files
    console.log('Generating file summaries...');
    const fileSummaries = await this.generateFileSummaries(
      repoUrl,
      fileStructure.filter(f => f.type === 'file').slice(0, 20)
    );

    // Step 8: Generate AI-powered content
    console.log('Generating project summary...');
    const summary = await watsonxService.generateProjectSummary(
      metadata.name,
      metadata.description,
      readme,
      [...techStack.languages, ...techStack.frameworks]
    );

    console.log('Generating setup guide...');
    const setupSteps = await watsonxService.generateSetupGuide(
      metadata.name,
      keyFiles['package.json'],
      keyFiles['requirements.txt'],
      readme
    );

    console.log('Generating architecture explanation...');
    const architecture = await watsonxService.generateArchitectureExplanation(
      metadata.name,
      fileStructure.map(f => f.path),
      [...techStack.languages, ...techStack.frameworks]
    );

    // Step 9: Build context object
    const contextId = generateContextId(repoUrl);
    const context: RepositoryContext = {
      contextId,
      repoUrl,
      metadata,
      techStack,
      readme,
      files: fileSummaries,
      scripts,
      dependencies,
      summary,
      setupSteps,
      architecture,
      analyzedAt: formatDate(),
    };

    // Step 10: Save context
    await this.saveContext(context);

    console.log(`Context built successfully: ${contextId}`);
    return context;
  }

  /**
   * Detects tech stack from files and dependencies
   */
  private async detectTechStack(
    files: FileInfo[],
    packageJson: string | null,
    requirementsTxt: string | null
  ): Promise<TechStack> {
    // Use AI to detect tech stack
    const aiDetection = await watsonxService.detectTechStack(
      files.map(f => f.path),
      packageJson,
      requirementsTxt
    );

    // Supplement with file extension analysis
    const languages = new Set(aiDetection.languages);
    files.forEach(file => {
      const lang = detectLanguage(file.path);
      if (lang !== 'Unknown') {
        languages.add(lang);
      }
    });

    return {
      languages: Array.from(languages),
      frameworks: aiDetection.frameworks,
      tools: aiDetection.tools,
    };
  }

  /**
   * Extracts package.json information
   */
  private extractPackageInfo(packageJson: string | null): {
    scripts: Record<string, string>;
    dependencies: {
      production: Record<string, string>;
      development: Record<string, string>;
    };
  } {
    if (!packageJson) {
      return {
        scripts: {},
        dependencies: { production: {}, development: {} },
      };
    }

    const pkg = safeJsonParse<any>(packageJson, {});

    return {
      scripts: pkg.scripts || {},
      dependencies: {
        production: pkg.dependencies || {},
        development: pkg.devDependencies || {},
      },
    };
  }

  /**
   * Generates summaries for important files
   */
  private async generateFileSummaries(
    repoUrl: string,
    files: FileInfo[]
  ): Promise<FileSummary[]> {
    const summaries: FileSummary[] = [];

    // Prioritize important files
    const sortedFiles = files.sort((a, b) => {
      const importanceA = getFileImportance(a.path);
      const importanceB = getFileImportance(b.path);
      const order = { high: 0, medium: 1, low: 2 };
      return order[importanceA] - order[importanceB];
    });

    // Process top 15 files
    const filesToProcess = sortedFiles.slice(0, 15);

    for (const file of filesToProcess) {
      try {
        const content = await githubService.getFileContent(repoUrl, file.path);

        if (!content || content.length === 0) continue;

        // Skip binary or very large files
        if (content.length > 50000) continue;

        const summary = await watsonxService.generateFileSummary(
          file.path,
          content
        );

        const keywords = extractKeywords(summary + ' ' + file.path);

        summaries.push({
          path: file.path,
          summary,
          keywords,
          importance: getFileImportance(file.path),
        });
      } catch (error) {
        console.warn(`Failed to process file ${file.path}:`, error);
      }
    }

    return summaries;
  }

  /**
   * Saves context to storage
   */
  private async saveContext(context: RepositoryContext): Promise<void> {
    const filePath = path.join(this.storageDir, `${context.contextId}.json`);

    try {
      await fs.writeFile(
        filePath,
        JSON.stringify(context, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save context:', error);
      throw new Error('Failed to save repository context');
    }
  }

  /**
   * Loads context from storage
   */
  async loadContext(contextId: string): Promise<RepositoryContext | null> {
    const filePath = path.join(this.storageDir, `${contextId}.json`);

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as RepositoryContext;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      console.error('Failed to load context:', error);
      throw new Error('Failed to load repository context');
    }
  }

  /**
   * Searches for relevant files based on a question
   */
  searchRelevantFiles(
    context: RepositoryContext,
    question: string,
    limit: number = 5
  ): Array<{ path: string; summary: string; score: number }> {
    const questionKeywords = new Set(extractKeywords(question));

    // Calculate relevance scores
    const scored = context.files.map(file => {
      const fileKeywords = new Set(file.keywords);
      const intersection = new Set(
        [...questionKeywords].filter(k => fileKeywords.has(k))
      );

      // Calculate score based on keyword overlap and importance
      let score = intersection.size / Math.max(questionKeywords.size, 1);

      // Boost score based on importance
      if (file.importance === 'high') score *= 1.5;
      else if (file.importance === 'medium') score *= 1.2;

      return {
        path: file.path,
        summary: file.summary,
        score,
      };
    });

    // Sort by score and return top results
    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Lists all stored contexts
   */
  async listContexts(): Promise<Array<{ contextId: string; repoUrl: string; analyzedAt: string }>> {
    try {
      const files = await fs.readdir(this.storageDir);
      const contexts = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const contextId = file.replace('.json', '');
          const context = await this.loadContext(contextId);

          if (context) {
            contexts.push({
              contextId: context.contextId,
              repoUrl: context.repoUrl,
              analyzedAt: context.analyzedAt,
            });
          }
        }
      }

      return contexts;
    } catch (error) {
      console.error('Failed to list contexts:', error);
      return [];
    }
  }

  /**
   * Deletes a context
   */
  async deleteContext(contextId: string): Promise<boolean> {
    const filePath = path.join(this.storageDir, `${contextId}.json`);

    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete context:', error);
      return false;
    }
  }
}

// Export singleton instance
export const contextService = new ContextService();

// Made with Bob
