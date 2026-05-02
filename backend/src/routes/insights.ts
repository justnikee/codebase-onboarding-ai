/**
 * Insights API Routes
 * Provides advanced code analysis, visualizations, and recommendations
 */

import express, { Request, Response } from 'express';
import { codeAnalyzerService } from '../services/code-analyzer.js';
import { visualizationService } from '../services/visualization.js';
import { recommendationService } from '../services/recommendations.js';
import { learningPathService } from '../services/learning-path.js';
import { contextService } from '../services/context.js';
import { FileInfo } from '../types/index.js';

const router = express.Router();

/**
 * GET /api/insights/:contextId/code-metrics
 * Get code quality metrics and analysis
 */
router.get('/:contextId/code-metrics', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;
    
    // Load context
    const context = await contextService.getContext(contextId);
    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }

    // Analyze code metrics
    const metrics = await codeAnalyzerService.analyzeCodeMetrics(
      context.repoUrl,
      context.fileStructure
    );

    // Analyze dependencies
    const packageJson = context.keyFiles['package.json'];
    const requirementsTxt = context.keyFiles['requirements.txt'];
    
    const dependencies = await codeAnalyzerService.analyzeDependencies(
      context.repoUrl,
      packageJson || null,
      requirementsTxt || null
    );

    // Detect architecture patterns
    const patterns = await codeAnalyzerService.detectArchitecturePatterns(
      context.fileStructure
    );

    // Detect code smells
    const smells = await codeAnalyzerService.detectCodeSmells(
      context.repoUrl,
      context.fileStructure
    );

    // Generate improvement suggestions
    const suggestions = await codeAnalyzerService.generateImprovementSuggestions(
      metrics,
      smells,
      patterns
    );

    res.json({
      metrics,
      dependencies,
      patterns,
      smells,
      suggestions,
    });
  } catch (error) {
    console.error('Error analyzing code metrics:', error);
    res.status(500).json({ 
      error: 'Failed to analyze code metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/insights/:contextId/visualizations
 * Get code visualizations (dependency graph, heatmap, architecture)
 */
router.get('/:contextId/visualizations', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;
    const { type } = req.query;
    
    // Load context
    const context = await contextService.getContext(contextId);
    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }

    let result: any = {};

    // Generate requested visualizations
    if (!type || type === 'dependency-graph') {
      result.dependencyGraph = await visualizationService.generateDependencyGraph(
        context.fileStructure,
        context.repoUrl
      );
    }

    if (!type || type === 'heatmap') {
      result.heatmap = await visualizationService.generateCodeHeatmap(
        context.fileStructure
      );
    }

    if (!type || type === 'architecture') {
      result.architecture = await visualizationService.generateArchitectureDiagram(
        context.fileStructure,
        context.techStack.languages
      );
    }

    if (!type || type === 'complexity') {
      result.complexity = await visualizationService.generateComplexityVisualization(
        context.fileStructure
      );
    }

    if (!type || type === 'timeline') {
      result.timeline = await visualizationService.generateTimeline(
        context.repoUrl
      );
    }

    res.json(result);
  } catch (error) {
    console.error('Error generating visualizations:', error);
    res.status(500).json({ 
      error: 'Failed to generate visualizations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/insights/:contextId/recommendations
 * Get AI-powered recommendations for improvements
 */
router.get('/:contextId/recommendations', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;
    
    // Load context
    const context = await contextService.getContext(contextId);
    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }

    // Get code metrics and smells
    const metrics = await codeAnalyzerService.analyzeCodeMetrics(
      context.repoUrl,
      context.fileStructure
    );

    const patterns = await codeAnalyzerService.detectArchitecturePatterns(
      context.fileStructure
    );

    const smells = await codeAnalyzerService.detectCodeSmells(
      context.repoUrl,
      context.fileStructure
    );

    // Generate recommendations
    const recommendations = await recommendationService.generateRecommendations(
      context.repoUrl,
      context.fileStructure,
      context.techStack.languages,
      metrics,
      smells,
      patterns
    );

    res.json({ recommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/insights/:contextId/contribution-opportunities
 * Find opportunities for developers to contribute
 */
router.get('/:contextId/contribution-opportunities', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;
    
    // Load context
    const context = await contextService.getContext(contextId);
    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }

    // Get code smells
    const smells = await codeAnalyzerService.detectCodeSmells(
      context.repoUrl,
      context.fileStructure
    );

    // Find contribution opportunities
    const opportunities = await recommendationService.findContributionOpportunities(
      context.fileStructure,
      context.techStack.languages,
      smells
    );

    res.json({ opportunities });
  } catch (error) {
    console.error('Error finding contribution opportunities:', error);
    res.status(500).json({ 
      error: 'Failed to find contribution opportunities',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/insights/:contextId/learning-path
 * Generate personalized learning path
 */
router.post('/:contextId/learning-path', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;
    const { profile } = req.body;
    
    // Load context
    const context = await contextService.getContext(contextId);
    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }

    // Generate learning path
    const learningPath = await learningPathService.generateLearningPath(
      context.repoUrl,
      context.techStack.languages,
      context.fileStructure,
      profile
    );

    res.json({ learningPath });
  } catch (error) {
    console.error('Error generating learning path:', error);
    res.status(500).json({ 
      error: 'Failed to generate learning path',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/insights/:contextId/learning-recommendations
 * Get personalized learning recommendations
 */
router.get('/:contextId/learning-recommendations', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;
    const { knownTechnologies } = req.query;
    
    // Load context
    const context = await contextService.getContext(contextId);
    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }

    // Parse known technologies
    const known = knownTechnologies 
      ? (knownTechnologies as string).split(',')
      : [];

    // Generate learning recommendations
    const recommendations = await recommendationService.generateLearningRecommendations(
      context.techStack.languages,
      known,
      context.fileStructure
    );

    res.json({ recommendations });
  } catch (error) {
    console.error('Error generating learning recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to generate learning recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/insights/:contextId/tool-recommendations
 * Get recommended tools and libraries
 */
router.get('/:contextId/tool-recommendations', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;
    
    // Load context
    const context = await contextService.getContext(contextId);
    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }

    // Generate tool recommendations
    const tools = await recommendationService.recommendTools(
      context.techStack.languages,
      context.fileStructure
    );

    res.json({ tools });
  } catch (error) {
    console.error('Error generating tool recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to generate tool recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/insights/:contextId/summary
 * Get comprehensive insights summary
 */
router.get('/:contextId/summary', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;
    
    // Load context
    const context = await contextService.getContext(contextId);
    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }

    // Get all insights in parallel
    const [metrics, patterns, smells, heatmap, recommendations] = await Promise.all([
      codeAnalyzerService.analyzeCodeMetrics(context.repoUrl, context.fileStructure),
      codeAnalyzerService.detectArchitecturePatterns(context.fileStructure),
      codeAnalyzerService.detectCodeSmells(context.repoUrl, context.fileStructure),
      visualizationService.generateCodeHeatmap(context.fileStructure),
      (async () => {
        const m = await codeAnalyzerService.analyzeCodeMetrics(context.repoUrl, context.fileStructure);
        const p = await codeAnalyzerService.detectArchitecturePatterns(context.fileStructure);
        const s = await codeAnalyzerService.detectCodeSmells(context.repoUrl, context.fileStructure);
        return recommendationService.generateRecommendations(
          context.repoUrl,
          context.fileStructure,
          context.techStack.languages,
          m,
          s,
          p
        );
      })(),
    ]);

    // Create summary
    const summary = {
      overview: {
        totalFiles: context.fileStructure.length,
        codeFiles: context.fileStructure.filter((f: FileInfo) =>
          /\.(js|ts|jsx|tsx|py|java|go|rs)$/.test(f.path)
        ).length,
        complexity: metrics.complexity,
        maintainability: metrics.maintainability,
        testCoverage: metrics.testCoverage,
        documentation: metrics.documentation,
      },
      architecture: {
        patterns: patterns.map(p => ({
          name: p.pattern,
          confidence: p.confidence,
        })),
        style: patterns.length > 0 ? patterns[0].pattern : 'No clear pattern detected',
      },
      quality: {
        totalSmells: smells.length,
        highSeverity: smells.filter(s => s.severity === 'high').length,
        mediumSeverity: smells.filter(s => s.severity === 'medium').length,
        lowSeverity: smells.filter(s => s.severity === 'low').length,
      },
      activity: {
        hottestFiles: heatmap.metrics.hottest.slice(0, 3),
        avgActivity: Math.round(heatmap.metrics.avgActivity),
      },
      topRecommendations: recommendations.slice(0, 5).map(r => ({
        title: r.title,
        type: r.type,
        priority: r.priority,
        impact: r.impact.overall,
      })),
    };

    res.json({ summary });
  } catch (error) {
    console.error('Error generating insights summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate insights summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

// Made with Bob
