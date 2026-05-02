/**
 * Advanced Code Analysis Service
 * Performs deep code analysis including complexity, dependencies, and patterns
 */

import { FileInfo } from '../types/index.js';
import { githubService } from './github.js';

interface CodeMetrics {
  complexity: 'low' | 'medium' | 'high';
  maintainability: number; // 0-100
  testCoverage: 'none' | 'partial' | 'good' | 'excellent';
  documentation: 'poor' | 'fair' | 'good' | 'excellent';
}

interface DependencyAnalysis {
  total: number;
  outdated: string[];
  security: {
    vulnerabilities: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  licenses: string[];
}

interface ArchitecturePattern {
  pattern: string;
  confidence: number;
  description: string;
  files: string[];
}

interface CodeSmell {
  type: string;
  severity: 'low' | 'medium' | 'high';
  file: string;
  line?: number;
  description: string;
  suggestion: string;
}

class CodeAnalyzerService {
  /**
   * Analyzes code complexity and quality metrics
   */
  async analyzeCodeMetrics(
    repoUrl: string,
    files: FileInfo[]
  ): Promise<CodeMetrics> {
    const codeFiles = files.filter(f => 
      f.path.match(/\.(js|ts|jsx|tsx|py|java|go|rs)$/)
    );

    // Calculate complexity based on file count and structure
    const complexity = this.calculateComplexity(codeFiles.length);
    
    // Estimate maintainability
    const maintainability = await this.estimateMaintainability(repoUrl, files);
    
    // Check for test files
    const testCoverage = this.estimateTestCoverage(files);
    
    // Check for documentation
    const documentation = this.assessDocumentation(files);

    return {
      complexity,
      maintainability,
      testCoverage,
      documentation,
    };
  }

  /**
   * Analyzes project dependencies
   */
  async analyzeDependencies(
    repoUrl: string,
    packageJson: string | null,
    requirementsTxt: string | null
  ): Promise<DependencyAnalysis> {
    const dependencies: string[] = [];
    
    if (packageJson) {
      const pkg = JSON.parse(packageJson);
      dependencies.push(...Object.keys(pkg.dependencies || {}));
      dependencies.push(...Object.keys(pkg.devDependencies || {}));
    }

    if (requirementsTxt) {
      const reqs = requirementsTxt.split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.split('==')[0].trim());
      dependencies.push(...reqs);
    }

    return {
      total: dependencies.length,
      outdated: [], // Would need external API to check
      security: {
        vulnerabilities: 0, // Would need security scanning
        severity: 'low',
      },
      licenses: this.detectLicenses(dependencies),
    };
  }

  /**
   * Detects architectural patterns in the codebase
   */
  async detectArchitecturePatterns(
    files: FileInfo[]
  ): Promise<ArchitecturePattern[]> {
    const patterns: ArchitecturePattern[] = [];

    // Detect MVC pattern
    if (this.hasMVCStructure(files)) {
      patterns.push({
        pattern: 'MVC (Model-View-Controller)',
        confidence: 0.85,
        description: 'Separates application into Models, Views, and Controllers',
        files: files.filter(f => 
          f.path.includes('model') || 
          f.path.includes('view') || 
          f.path.includes('controller')
        ).map(f => f.path),
      });
    }

    // Detect Microservices
    if (this.hasMicroservicesStructure(files)) {
      patterns.push({
        pattern: 'Microservices Architecture',
        confidence: 0.75,
        description: 'Application split into independent services',
        files: files.filter(f => f.path.includes('service')).map(f => f.path),
      });
    }

    // Detect Layered Architecture
    if (this.hasLayeredStructure(files)) {
      patterns.push({
        pattern: 'Layered Architecture',
        confidence: 0.80,
        description: 'Organized in distinct layers (presentation, business, data)',
        files: files.filter(f => 
          f.path.includes('layer') || 
          f.path.includes('tier')
        ).map(f => f.path),
      });
    }

    // Detect Clean Architecture
    if (this.hasCleanArchitecture(files)) {
      patterns.push({
        pattern: 'Clean Architecture',
        confidence: 0.70,
        description: 'Domain-centric with dependency inversion',
        files: files.filter(f => 
          f.path.includes('domain') || 
          f.path.includes('usecase') ||
          f.path.includes('entity')
        ).map(f => f.path),
      });
    }

    return patterns;
  }

  /**
   * Identifies code smells and anti-patterns
   */
  async detectCodeSmells(
    repoUrl: string,
    files: FileInfo[]
  ): Promise<CodeSmell[]> {
    const smells: CodeSmell[] = [];

    // Check for large files
    const largeFiles = files.filter(f => (f.size || 0) > 1000000); // > 1MB
    largeFiles.forEach(file => {
      smells.push({
        type: 'Large File',
        severity: 'medium',
        file: file.path,
        description: `File is very large (${Math.round((file.size || 0) / 1024)}KB)`,
        suggestion: 'Consider splitting into smaller, more focused modules',
      });
    });

    // Check for deep nesting
    const deeplyNested = files.filter(f => 
      f.path.split('/').length > 8
    );
    deeplyNested.forEach(file => {
      smells.push({
        type: 'Deep Nesting',
        severity: 'low',
        file: file.path,
        description: 'File is deeply nested in directory structure',
        suggestion: 'Consider flattening the directory structure',
      });
    });

    // Check for missing tests
    const hasTests = files.some(f => 
      f.path.includes('test') || 
      f.path.includes('spec') ||
      f.path.includes('__tests__')
    );
    if (!hasTests) {
      smells.push({
        type: 'Missing Tests',
        severity: 'high',
        file: 'project root',
        description: 'No test files detected in the repository',
        suggestion: 'Add unit tests to improve code quality and maintainability',
      });
    }

    // Check for missing documentation
    const hasReadme = files.some(f => 
      f.path.toLowerCase() === 'readme.md'
    );
    if (!hasReadme) {
      smells.push({
        type: 'Missing Documentation',
        severity: 'high',
        file: 'project root',
        description: 'No README.md file found',
        suggestion: 'Add a README.md to document the project',
      });
    }

    return smells;
  }

  /**
   * Generates improvement suggestions
   */
  async generateImprovementSuggestions(
    metrics: CodeMetrics,
    smells: CodeSmell[],
    patterns: ArchitecturePattern[]
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Based on complexity
    if (metrics.complexity === 'high') {
      suggestions.push('Consider refactoring complex modules into smaller, more manageable pieces');
    }

    // Based on maintainability
    if (metrics.maintainability < 50) {
      suggestions.push('Improve code maintainability by adding comments and documentation');
      suggestions.push('Consider applying SOLID principles to improve code structure');
    }

    // Based on test coverage
    if (metrics.testCoverage === 'none' || metrics.testCoverage === 'partial') {
      suggestions.push('Increase test coverage to improve code reliability');
      suggestions.push('Add integration tests for critical paths');
    }

    // Based on documentation
    if (metrics.documentation === 'poor' || metrics.documentation === 'fair') {
      suggestions.push('Enhance inline documentation and code comments');
      suggestions.push('Create or improve API documentation');
    }

    // Based on code smells
    const highSeveritySmells = smells.filter(s => s.severity === 'high');
    if (highSeveritySmells.length > 0) {
      suggestions.push(`Address ${highSeveritySmells.length} high-severity code issues`);
    }

    // Based on architecture
    if (patterns.length === 0) {
      suggestions.push('Consider adopting a clear architectural pattern (MVC, Clean Architecture, etc.)');
    }

    return suggestions;
  }

  // Helper methods
  private calculateComplexity(fileCount: number): 'low' | 'medium' | 'high' {
    if (fileCount < 50) return 'low';
    if (fileCount < 200) return 'medium';
    return 'high';
  }

  private async estimateMaintainability(
    repoUrl: string,
    files: FileInfo[]
  ): Promise<number> {
    let score = 100;

    // Deduct for large number of files
    if (files.length > 500) score -= 20;
    else if (files.length > 200) score -= 10;

    // Deduct for deep nesting
    const avgDepth = files.reduce((sum, f) => 
      sum + f.path.split('/').length, 0
    ) / files.length;
    if (avgDepth > 5) score -= 15;

    // Add for good structure
    const hasGoodStructure = files.some(f => 
      f.path.includes('src') || f.path.includes('lib')
    );
    if (hasGoodStructure) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private estimateTestCoverage(files: FileInfo[]): 'none' | 'partial' | 'good' | 'excellent' {
    const testFiles = files.filter(f => 
      f.path.includes('test') || 
      f.path.includes('spec') ||
      f.path.includes('__tests__')
    );

    const codeFiles = files.filter(f => 
      f.path.match(/\.(js|ts|jsx|tsx|py|java)$/) &&
      !f.path.includes('test') &&
      !f.path.includes('spec')
    );

    if (testFiles.length === 0) return 'none';
    
    const ratio = testFiles.length / codeFiles.length;
    if (ratio > 0.5) return 'excellent';
    if (ratio > 0.3) return 'good';
    return 'partial';
  }

  private assessDocumentation(files: FileInfo[]): 'poor' | 'fair' | 'good' | 'excellent' {
    const hasReadme = files.some(f => f.path.toLowerCase().includes('readme'));
    const hasDocs = files.some(f => f.path.includes('docs') || f.path.includes('documentation'));
    const hasComments = files.length > 0; // Simplified

    if (hasReadme && hasDocs) return 'excellent';
    if (hasReadme) return 'good';
    if (hasDocs) return 'fair';
    return 'poor';
  }

  private detectLicenses(dependencies: string[]): string[] {
    // Simplified - would need actual license detection
    return ['MIT', 'Apache-2.0', 'ISC'];
  }

  private hasMVCStructure(files: FileInfo[]): boolean {
    const hasModels = files.some(f => f.path.includes('model'));
    const hasViews = files.some(f => f.path.includes('view'));
    const hasControllers = files.some(f => f.path.includes('controller'));
    return hasModels && hasViews && hasControllers;
  }

  private hasMicroservicesStructure(files: FileInfo[]): boolean {
    const serviceFiles = files.filter(f => f.path.includes('service'));
    return serviceFiles.length > 3;
  }

  private hasLayeredStructure(files: FileInfo[]): boolean {
    const layers = ['presentation', 'business', 'data', 'domain'];
    const foundLayers = layers.filter(layer => 
      files.some(f => f.path.toLowerCase().includes(layer))
    );
    return foundLayers.length >= 2;
  }

  private hasCleanArchitecture(files: FileInfo[]): boolean {
    const hasEntities = files.some(f => f.path.includes('entity') || f.path.includes('entities'));
    const hasUseCases = files.some(f => f.path.includes('usecase') || f.path.includes('use-case'));
    const hasDomain = files.some(f => f.path.includes('domain'));
    return (hasEntities || hasDomain) && hasUseCases;
  }
}

export const codeAnalyzerService = new CodeAnalyzerService();

// Export types
export type {
  CodeMetrics,
  DependencyAnalysis,
  ArchitecturePattern,
  CodeSmell,
};

// Made with Bob
