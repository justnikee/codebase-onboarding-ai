/**
 * Repository Analysis Routes
 */

import { Router, Request, Response, NextFunction } from "express";
import { contextService } from "../services/context.js";
import { validateGitHubUrl } from "../utils/validators.js";
import { AppError } from "../types/index.js";
import { saveAnalysis, trackEvent } from "../services/database.js";
import { computeRepoMetrics } from "../utils/helpers.js";

const router = Router();

/**
 * POST /api/analyze
 * Analyzes a GitHub repository and generates onboarding content
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoUrl, deepScan } = req.body;
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : undefined;
    const userId = (req as any).userId as string | null;

    if (!repoUrl) {
      throw new AppError("Repository URL is required", 400);
    }

    // Validate GitHub URL
    const validatedUrl = validateGitHubUrl(repoUrl);

    // Build repository context (deep scan: maxDepth 6, maxFiles 300)
    const scanOptions = deepScan ? { maxDepth: 6, maxFiles: 300 } : undefined;
    const context = await contextService.buildContext(
      validatedUrl,
      token,
      scanOptions,
    );

    // Persist analysis record if user is authenticated
    if (userId) {
      await saveAnalysis({
        userId,
        repoUrl: context.repoUrl,
        repoFullName: context.metadata?.fullName ?? null,
        contextId: context.contextId,
        summarySnapshot: context.summary?.substring(0, 500) ?? null,
      });
      await trackEvent({
        userId,
        eventType: "analysis_completed",
        metadata: { repoUrl: context.repoUrl },
      });
    }

    // Compute real metrics from analysis data
    const metrics = computeRepoMetrics(context);

    // Return analysis results
    res.status(200).json({
      success: true,
      data: {
        contextId: context.contextId,
        repoUrl: context.repoUrl,
        metadata: context.metadata,
        techStack: context.techStack,
        summary: context.summary,
        setupSteps: context.setupSteps,
        architecture: context.architecture,
        analyzedAt: context.analyzedAt,
        metrics,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analyze/:contextId
 * Retrieves analysis results for a specific context
 */
router.get(
  "/:contextId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contextId } = req.params;

      const context = await contextService.loadContext(contextId);

      if (!context) {
        throw new AppError("Context not found", 404);
      }

      const metrics = computeRepoMetrics(context);

      res.status(200).json({
        success: true,
        data: {
          contextId: context.contextId,
          repoUrl: context.repoUrl,
          metadata: context.metadata,
          techStack: context.techStack,
          summary: context.summary,
          setupSteps: context.setupSteps,
          architecture: context.architecture,
          readme: context.readme,
          scripts: context.scripts,
          dependencies: context.dependencies,
          analyzedAt: context.analyzedAt,
          metrics,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/analyze
 * Lists all analyzed repositories
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contexts = await contextService.listContexts();

    res.status(200).json({
      success: true,
      data: contexts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/analyze/:contextId
 * Deletes a repository analysis
 */
router.delete(
  "/:contextId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contextId } = req.params;

      const deleted = await contextService.deleteContext(contextId);

      if (!deleted) {
        throw new AppError("Failed to delete context", 500);
      }

      res.status(200).json({
        success: true,
        message: "Context deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

// Made with Bob
