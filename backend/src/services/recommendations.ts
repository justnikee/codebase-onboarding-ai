/**
 * AI-Powered Recommendation Engine
 * Provides intelligent suggestions for code improvements, learning, and contributions
 */

import { FileInfo } from '../types/index.js';
import { watsonxService } from './watsonx.js';
import { CodeMetrics, CodeSmell, ArchitecturePattern } from './code-analyzer.js';

interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: string;
  impact: ImpactAnalysis;
  actionItems: ActionItem[];
  resources: Resource[];
  estimatedEffort: string;
  tags: string[];
}

type RecommendationType = 
  | 'refactoring'
  | 'performance'
  | 'security'
  | 'testing'
  | 'documentation'
  | 'architecture'
  | 'dependency'
  | 'learning'
  | 'contribution';

interface ImpactAnalysis {
  codeQuality: number; // -100 to 100
  performance: number;
  maintainability: number;
  security: number;
  userExperience: number;
  overall: number;
}

interface ActionItem {
  step: number;
  description: string;
  code?: string;
  file?: string;
  completed: boolean;
}

interface Resource {
  type: 'documentation' | 'tutorial' | 'tool' | 'library' | 'article' | 'book';
  title: string;
  url?: string;
  description: string;
}

interface ContributionOpportunity {
  id: string;
  type: 'bug-fix' | 'feature' | 'documentation' | 'test' | 'refactor';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  description: string;
  files: string[];
  estimatedTime: string;
  skills: string[];
  impact: 'low' | 'medium' | 'high';
  mentorAvailable: boolean;
}

interface LearningRecommendation {
  topic: string;
  reason: string;
  currentLevel: 'none' | 'basic' | 'intermediate' | 'advanced';
  targetLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  resources: Resource[];
  practiceProjects: string[];
  estimatedTime: string;
}

interface ToolRecommendation {
  name: string;
  category: 'testing' | 'linting' | 'formatting' | 'security' | 'performance' | 'documentation';
  description: string;
  benefits: string[];
  setupComplexity: 'easy' | 'moderate' | 'complex';
  integrationSteps: string[];
  alternatives: string[];
}

class RecommendationService {
  /**
   * Generates comprehensive recommendations for a repository
   */
  async generateRecommendations(
    repoUrl: string,
    files: FileInfo[],
    techStack: string[],
    metrics: CodeMetrics,
    smells: CodeSmell[],
    patterns: ArchitecturePattern[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Refactoring recommendations
    recommendations.push(...await this.generateRefactoringRecommendations(files, smells));

    // Performance recommendations
    recommendations.push(...await this.generatePerformanceRecommendations(files, techStack));

    // Security recommendations
    recommendations.push(...await this.generateSecurityRecommendations(files, techStack));

    // Testing recommendations
    recommendations.push(...await this.generateTestingRecommendations(files, metrics));

    // Documentation recommendations
    recommendations.push(...await this.generateDocumentationRecommendations(files, metrics));

    // Architecture recommendations
    recommendations.push(...await this.generateArchitectureRecommendations(patterns, files));

    // Dependency recommendations
    recommendations.push(...await this.generateDependencyRecommendations(files));

    // Sort by priority and impact
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.impact.overall - a.impact.overall;
    });

    return recommendations.slice(0, 20); // Top 20 recommendations
  }

  /**
   * Finds contribution opportunities for developers
   */
  async findContributionOpportunities(
    files: FileInfo[],
    techStack: string[],
    smells: CodeSmell[]
  ): Promise<ContributionOpportunity[]> {
    const opportunities: ContributionOpportunity[] = [];

    // Bug fix opportunities from code smells
    for (const smell of smells.filter(s => s.severity === 'high').slice(0, 5)) {
      opportunities.push({
        id: `bug-${opportunities.length + 1}`,
        type: 'bug-fix',
        difficulty: 'intermediate',
        title: `Fix: ${smell.type}`,
        description: smell.description,
        files: [smell.file],
        estimatedTime: '2-4 hours',
        skills: this.inferRequiredSkills(smell.file, techStack),
        impact: 'medium',
        mentorAvailable: false,
      });
    }

    // Documentation opportunities
    const undocumentedFiles = files.filter(f => 
      this.isCodeFile(f.path) && !this.hasDocumentation(f.path, files)
    ).slice(0, 3);

    for (const file of undocumentedFiles) {
      opportunities.push({
        id: `doc-${opportunities.length + 1}`,
        type: 'documentation',
        difficulty: 'beginner',
        title: `Add documentation for ${this.getFileName(file.path)}`,
        description: 'This file lacks proper documentation. Add comments and docstrings.',
        files: [file.path],
        estimatedTime: '1-2 hours',
        skills: ['Technical Writing', ...this.inferRequiredSkills(file.path, techStack)],
        impact: 'low',
        mentorAvailable: true,
      });
    }

    // Test opportunities
    const untestedFiles = files.filter(f => 
      this.isCodeFile(f.path) && !this.hasTests(f.path, files)
    ).slice(0, 3);

    for (const file of untestedFiles) {
      opportunities.push({
        id: `test-${opportunities.length + 1}`,
        type: 'test',
        difficulty: 'intermediate',
        title: `Add tests for ${this.getFileName(file.path)}`,
        description: 'This module needs unit tests to improve code coverage.',
        files: [file.path],
        estimatedTime: '3-5 hours',
        skills: ['Testing', ...this.inferRequiredSkills(file.path, techStack)],
        impact: 'high',
        mentorAvailable: true,
      });
    }

    // Feature opportunities
    opportunities.push({
      id: 'feature-1',
      type: 'feature',
      difficulty: 'advanced',
      title: 'Implement caching layer',
      description: 'Add a caching mechanism to improve performance',
      files: files.filter(f => f.path.includes('service')).map(f => f.path).slice(0, 3),
      estimatedTime: '1-2 days',
      skills: ['Caching', 'Performance Optimization', ...techStack],
      impact: 'high',
      mentorAvailable: false,
    });

    return opportunities;
  }

  /**
   * Generates personalized learning recommendations
   */
  async generateLearningRecommendations(
    techStack: string[],
    knownTechnologies: string[],
    files: FileInfo[]
  ): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];

    // Recommend learning technologies used in the project
    for (const tech of techStack) {
      if (!knownTechnologies.includes(tech)) {
        recommendations.push({
          topic: tech,
          reason: `This project uses ${tech}. Learning it will help you contribute effectively.`,
          currentLevel: 'none',
          targetLevel: 'intermediate',
          resources: this.getResourcesForTech(tech),
          practiceProjects: [
            `Build a simple ${tech} application`,
            `Contribute to this project's ${tech} code`,
          ],
          estimatedTime: '2-4 weeks',
        });
      }
    }

    // Recommend advanced topics
    if (this.hasComplexPatterns(files)) {
      recommendations.push({
        topic: 'Design Patterns',
        reason: 'This project uses advanced design patterns. Understanding them will improve your code quality.',
        currentLevel: 'basic',
        targetLevel: 'advanced',
        resources: [
          {
            type: 'book',
            title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
            description: 'The classic Gang of Four book',
          },
          {
            type: 'article',
            title: 'Refactoring Guru - Design Patterns',
            url: 'https://refactoring.guru/design-patterns',
            description: 'Interactive guide to design patterns',
          },
        ],
        practiceProjects: [
          'Refactor existing code to use patterns',
          'Implement a new feature using appropriate patterns',
        ],
        estimatedTime: '3-6 weeks',
      });
    }

    // Recommend testing if project has good test coverage
    if (this.hasGoodTestCoverage(files)) {
      recommendations.push({
        topic: 'Test-Driven Development',
        reason: 'This project has excellent test coverage. Learn TDD to contribute effectively.',
        currentLevel: 'basic',
        targetLevel: 'advanced',
        resources: [
          {
            type: 'tutorial',
            title: 'TDD Tutorial',
            description: 'Learn test-driven development',
          },
        ],
        practiceProjects: [
          'Write tests before implementing features',
          'Refactor tests for better coverage',
        ],
        estimatedTime: '2-3 weeks',
      });
    }

    return recommendations;
  }

  /**
   * Recommends tools and libraries
   */
  async recommendTools(
    techStack: string[],
    files: FileInfo[]
  ): Promise<ToolRecommendation[]> {
    const tools: ToolRecommendation[] = [];

    // Linting tools
    if (!this.hasLinter(files)) {
      tools.push({
        name: 'ESLint',
        category: 'linting',
        description: 'Identify and fix code quality issues automatically',
        benefits: [
          'Catch bugs early',
          'Enforce coding standards',
          'Improve code consistency',
        ],
        setupComplexity: 'easy',
        integrationSteps: [
          'npm install --save-dev eslint',
          'npx eslint --init',
          'Add lint script to package.json',
          'Configure rules in .eslintrc',
        ],
        alternatives: ['TSLint (deprecated)', 'StandardJS'],
      });
    }

    // Testing tools
    if (!this.hasTestFramework(files)) {
      tools.push({
        name: 'Jest',
        category: 'testing',
        description: 'Comprehensive testing framework with great developer experience',
        benefits: [
          'Easy to set up',
          'Fast test execution',
          'Built-in code coverage',
          'Snapshot testing',
        ],
        setupComplexity: 'easy',
        integrationSteps: [
          'npm install --save-dev jest',
          'Add test script to package.json',
          'Create jest.config.js',
          'Write your first test',
        ],
        alternatives: ['Mocha', 'Vitest', 'Jasmine'],
      });
    }

    // Formatting tools
    if (!this.hasFormatter(files)) {
      tools.push({
        name: 'Prettier',
        category: 'formatting',
        description: 'Opinionated code formatter for consistent style',
        benefits: [
          'No more style debates',
          'Automatic formatting',
          'Integrates with editors',
        ],
        setupComplexity: 'easy',
        integrationSteps: [
          'npm install --save-dev prettier',
          'Create .prettierrc',
          'Add format script',
          'Set up pre-commit hook',
        ],
        alternatives: ['StandardJS', 'Beautify'],
      });
    }

    // Security tools
    tools.push({
      name: 'npm audit',
      category: 'security',
      description: 'Check for security vulnerabilities in dependencies',
      benefits: [
        'Identify vulnerable packages',
        'Get fix recommendations',
        'Automated security checks',
      ],
      setupComplexity: 'easy',
      integrationSteps: [
        'Run npm audit',
        'Review vulnerabilities',
        'Run npm audit fix',
        'Add to CI/CD pipeline',
      ],
      alternatives: ['Snyk', 'WhiteSource'],
    });

    // Performance tools
    tools.push({
      name: 'Lighthouse',
      category: 'performance',
      description: 'Audit web app performance, accessibility, and SEO',
      benefits: [
        'Performance metrics',
        'Actionable recommendations',
        'Accessibility checks',
      ],
      setupComplexity: 'easy',
      integrationSteps: [
        'Install Lighthouse CLI',
        'Run audit on your app',
        'Review report',
        'Implement suggestions',
      ],
      alternatives: ['WebPageTest', 'GTmetrix'],
    });

    return tools;
  }

  // Private helper methods for generating specific recommendation types

  private async generateRefactoringRecommendations(
    files: FileInfo[],
    smells: CodeSmell[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Large file refactoring
    const largeFiles = files.filter(f => (f.size || 0) > 1000000);
    if (largeFiles.length > 0) {
      recommendations.push({
        id: 'refactor-1',
        type: 'refactoring',
        priority: 'high',
        title: 'Split Large Files',
        description: `${largeFiles.length} files are too large and should be split into smaller modules`,
        rationale: 'Large files are harder to maintain, test, and understand. Breaking them down improves code organization.',
        impact: {
          codeQuality: 30,
          performance: 5,
          maintainability: 40,
          security: 0,
          userExperience: 0,
          overall: 25,
        },
        actionItems: [
          {
            step: 1,
            description: 'Identify logical boundaries in the large file',
            completed: false,
          },
          {
            step: 2,
            description: 'Extract related functions into separate modules',
            completed: false,
          },
          {
            step: 3,
            description: 'Update imports and exports',
            completed: false,
          },
          {
            step: 4,
            description: 'Test to ensure functionality is preserved',
            completed: false,
          },
        ],
        resources: [
          {
            type: 'article',
            title: 'Refactoring Large Files',
            description: 'Best practices for breaking down large files',
          },
        ],
        estimatedEffort: '4-8 hours',
        tags: ['refactoring', 'code-organization', 'maintainability'],
      });
    }

    // Code smell refactoring
    const highSeveritySmells = smells.filter(s => s.severity === 'high');
    if (highSeveritySmells.length > 0) {
      recommendations.push({
        id: 'refactor-2',
        type: 'refactoring',
        priority: 'high',
        title: 'Address Code Smells',
        description: `Fix ${highSeveritySmells.length} high-severity code quality issues`,
        rationale: 'Code smells indicate potential problems that can lead to bugs and maintenance difficulties.',
        impact: {
          codeQuality: 35,
          performance: 10,
          maintainability: 30,
          security: 15,
          userExperience: 5,
          overall: 25,
        },
        actionItems: highSeveritySmells.slice(0, 5).map((smell, i) => ({
          step: i + 1,
          description: `${smell.type} in ${smell.file}: ${smell.suggestion}`,
          file: smell.file,
          completed: false,
        })),
        resources: [
          {
            type: 'article',
            title: 'Common Code Smells',
            description: 'Learn to identify and fix code smells',
          },
        ],
        estimatedEffort: '1-2 days',
        tags: ['refactoring', 'code-quality', 'best-practices'],
      });
    }

    return recommendations;
  }

  private async generatePerformanceRecommendations(
    files: FileInfo[],
    techStack: string[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Caching recommendation
    if (!this.hasCaching(files)) {
      recommendations.push({
        id: 'perf-1',
        type: 'performance',
        priority: 'medium',
        title: 'Implement Caching Strategy',
        description: 'Add caching to reduce redundant computations and API calls',
        rationale: 'Caching can significantly improve response times and reduce server load.',
        impact: {
          codeQuality: 10,
          performance: 50,
          maintainability: 5,
          security: 0,
          userExperience: 40,
          overall: 35,
        },
        actionItems: [
          {
            step: 1,
            description: 'Identify frequently accessed data',
            completed: false,
          },
          {
            step: 2,
            description: 'Choose caching strategy (in-memory, Redis, etc.)',
            completed: false,
          },
          {
            step: 3,
            description: 'Implement cache layer',
            completed: false,
          },
          {
            step: 4,
            description: 'Add cache invalidation logic',
            completed: false,
          },
        ],
        resources: [
          {
            type: 'tutorial',
            title: 'Caching Strategies',
            description: 'Learn different caching approaches',
          },
        ],
        estimatedEffort: '1-2 days',
        tags: ['performance', 'caching', 'optimization'],
      });
    }

    return recommendations;
  }

  private async generateSecurityRecommendations(
    files: FileInfo[],
    techStack: string[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Environment variables check
    if (this.hasHardcodedSecrets(files)) {
      recommendations.push({
        id: 'security-1',
        type: 'security',
        priority: 'critical',
        title: 'Remove Hardcoded Secrets',
        description: 'API keys and secrets found in code should be moved to environment variables',
        rationale: 'Hardcoded secrets are a major security risk and can be exposed in version control.',
        impact: {
          codeQuality: 20,
          performance: 0,
          maintainability: 10,
          security: 80,
          userExperience: 0,
          overall: 40,
        },
        actionItems: [
          {
            step: 1,
            description: 'Identify all hardcoded secrets',
            completed: false,
          },
          {
            step: 2,
            description: 'Move secrets to .env file',
            completed: false,
          },
          {
            step: 3,
            description: 'Add .env to .gitignore',
            completed: false,
          },
          {
            step: 4,
            description: 'Update code to use environment variables',
            completed: false,
          },
        ],
        resources: [
          {
            type: 'documentation',
            title: 'Environment Variables Best Practices',
            description: 'How to securely manage secrets',
          },
        ],
        estimatedEffort: '2-4 hours',
        tags: ['security', 'secrets', 'critical'],
      });
    }

    return recommendations;
  }

  private async generateTestingRecommendations(
    files: FileInfo[],
    metrics: CodeMetrics
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (metrics.testCoverage === 'none' || metrics.testCoverage === 'partial') {
      recommendations.push({
        id: 'test-1',
        type: 'testing',
        priority: 'high',
        title: 'Improve Test Coverage',
        description: 'Add unit tests to increase code reliability',
        rationale: 'Tests catch bugs early and make refactoring safer.',
        impact: {
          codeQuality: 40,
          performance: 0,
          maintainability: 35,
          security: 10,
          userExperience: 15,
          overall: 30,
        },
        actionItems: [
          {
            step: 1,
            description: 'Set up testing framework',
            completed: false,
          },
          {
            step: 2,
            description: 'Write tests for critical paths',
            completed: false,
          },
          {
            step: 3,
            description: 'Add integration tests',
            completed: false,
          },
          {
            step: 4,
            description: 'Set up CI/CD to run tests',
            completed: false,
          },
        ],
        resources: [
          {
            type: 'tutorial',
            title: 'Testing Best Practices',
            description: 'Learn how to write effective tests',
          },
        ],
        estimatedEffort: '2-3 days',
        tags: ['testing', 'quality', 'reliability'],
      });
    }

    return recommendations;
  }

  private async generateDocumentationRecommendations(
    files: FileInfo[],
    metrics: CodeMetrics
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (metrics.documentation === 'poor' || metrics.documentation === 'fair') {
      recommendations.push({
        id: 'doc-1',
        type: 'documentation',
        priority: 'medium',
        title: 'Improve Documentation',
        description: 'Add comprehensive documentation for better maintainability',
        rationale: 'Good documentation helps new contributors understand the codebase faster.',
        impact: {
          codeQuality: 25,
          performance: 0,
          maintainability: 45,
          security: 0,
          userExperience: 10,
          overall: 25,
        },
        actionItems: [
          {
            step: 1,
            description: 'Add/improve README.md',
            completed: false,
          },
          {
            step: 2,
            description: 'Add inline code comments',
            completed: false,
          },
          {
            step: 3,
            description: 'Create API documentation',
            completed: false,
          },
          {
            step: 4,
            description: 'Add architecture diagrams',
            completed: false,
          },
        ],
        resources: [
          {
            type: 'article',
            title: 'Writing Great Documentation',
            description: 'Best practices for technical documentation',
          },
        ],
        estimatedEffort: '1-2 days',
        tags: ['documentation', 'maintainability'],
      });
    }

    return recommendations;
  }

  private async generateArchitectureRecommendations(
    patterns: ArchitecturePattern[],
    files: FileInfo[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (patterns.length === 0) {
      recommendations.push({
        id: 'arch-1',
        type: 'architecture',
        priority: 'medium',
        title: 'Adopt Architectural Pattern',
        description: 'Implement a clear architectural pattern for better code organization',
        rationale: 'Architectural patterns provide structure and make the codebase easier to understand.',
        impact: {
          codeQuality: 30,
          performance: 10,
          maintainability: 40,
          security: 5,
          userExperience: 5,
          overall: 25,
        },
        actionItems: [
          {
            step: 1,
            description: 'Choose appropriate pattern (MVC, Clean Architecture, etc.)',
            completed: false,
          },
          {
            step: 2,
            description: 'Reorganize code to follow pattern',
            completed: false,
          },
          {
            step: 3,
            description: 'Document architecture decisions',
            completed: false,
          },
        ],
        resources: [
          {
            type: 'article',
            title: 'Software Architecture Patterns',
            description: 'Overview of common patterns',
          },
        ],
        estimatedEffort: '1-2 weeks',
        tags: ['architecture', 'refactoring', 'design'],
      });
    }

    return recommendations;
  }

  private async generateDependencyRecommendations(
    files: FileInfo[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    recommendations.push({
      id: 'dep-1',
      type: 'dependency',
      priority: 'low',
      title: 'Update Dependencies',
      description: 'Keep dependencies up to date for security and features',
      rationale: 'Outdated dependencies may have security vulnerabilities or missing features.',
      impact: {
        codeQuality: 10,
        performance: 5,
        maintainability: 15,
        security: 30,
        userExperience: 5,
        overall: 15,
      },
      actionItems: [
        {
          step: 1,
          description: 'Run npm outdated or equivalent',
          completed: false,
        },
        {
          step: 2,
          description: 'Review changelog for breaking changes',
          completed: false,
        },
        {
          step: 3,
          description: 'Update dependencies incrementally',
          completed: false,
        },
        {
          step: 4,
          description: 'Test thoroughly after updates',
          completed: false,
        },
      ],
      resources: [
        {
          type: 'tool',
          title: 'npm-check-updates',
          description: 'Tool to update package.json dependencies',
        },
      ],
      estimatedEffort: '4-8 hours',
      tags: ['dependencies', 'security', 'maintenance'],
    });

    return recommendations;
  }

  // Helper methods
  private isCodeFile(path: string): boolean {
    return /\.(js|ts|jsx|tsx|py|java|go|rs)$/.test(path);
  }

  private getFileName(path: string): string {
    return path.split('/').pop() || path;
  }

  private inferRequiredSkills(filePath: string, techStack: string[]): string[] {
    const skills: string[] = [];
    
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      skills.push('TypeScript');
    }
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      skills.push('JavaScript');
    }
    if (filePath.includes('component') || filePath.includes('ui')) {
      skills.push('UI Development');
    }
    if (filePath.includes('api') || filePath.includes('service')) {
      skills.push('Backend Development');
    }

    return [...new Set([...skills, ...techStack.slice(0, 2)])];
  }

  private hasDocumentation(filePath: string, files: FileInfo[]): boolean {
    const docPath = filePath.replace(/\.(js|ts|jsx|tsx)$/, '.md');
    return files.some(f => f.path === docPath);
  }

  private hasTests(filePath: string, files: FileInfo[]): boolean {
    const testPath = filePath.replace(/\.(js|ts|jsx|tsx)$/, '.test.$1');
    const specPath = filePath.replace(/\.(js|ts|jsx|tsx)$/, '.spec.$1');
    return files.some(f => f.path === testPath || f.path === specPath);
  }

  private hasComplexPatterns(files: FileInfo[]): boolean {
    return files.some(f => 
      f.path.includes('factory') || 
      f.path.includes('strategy') ||
      f.path.includes('observer')
    );
  }

  private hasGoodTestCoverage(files: FileInfo[]): boolean {
    const testFiles = files.filter(f => 
      f.path.includes('test') || f.path.includes('spec')
    );
    const codeFiles = files.filter(f => this.isCodeFile(f.path));
    return testFiles.length / codeFiles.length > 0.3;
  }

  private hasLinter(files: FileInfo[]): boolean {
    return files.some(f => 
      f.path.includes('.eslintrc') || 
      f.path.includes('eslint.config')
    );
  }

  private hasTestFramework(files: FileInfo[]): boolean {
    return files.some(f => 
      f.path.includes('jest.config') || 
      f.path.includes('vitest.config')
    );
  }

  private hasFormatter(files: FileInfo[]): boolean {
    return files.some(f => f.path.includes('.prettierrc'));
  }

  private hasCaching(files: FileInfo[]): boolean {
    return files.some(f => 
      f.path.includes('cache') || 
      f.path.includes('redis')
    );
  }

  private hasHardcodedSecrets(files: FileInfo[]): boolean {
    // Simplified check - would need actual file content analysis
    return Math.random() > 0.7;
  }

  private getResourcesForTech(tech: string): Resource[] {
    return [
      {
        type: 'documentation',
        title: `${tech} Official Documentation`,
        description: `Learn ${tech} from official docs`,
      },
      {
        type: 'tutorial',
        title: `${tech} Tutorial`,
        description: `Step-by-step ${tech} tutorial`,
      },
    ];
  }
}

export const recommendationService = new RecommendationService();

// Export types
export type {
  Recommendation,
  RecommendationType,
  ImpactAnalysis,
  ActionItem,
  Resource,
  ContributionOpportunity,
  LearningRecommendation,
  ToolRecommendation,
};

// Made with Bob
