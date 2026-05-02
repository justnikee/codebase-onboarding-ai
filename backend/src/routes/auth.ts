/**
 * Auth Routes
 * POST /api/auth/sync   – called by NextAuth after GitHub sign-in to upsert user
 * POST /api/auth/feedback – submit thumbs-up/down on a chat answer
 */

import { Router, Request, Response, NextFunction } from "express";
import { upsertUser, saveFeedback } from "../services/database.js";
import { AppError } from "../types/index.js";

const router = Router();

/**
 * POST /api/auth/sync
 * Body: { githubId, email?, name?, avatarUrl? }
 * Returns: { userId }
 */
router.post(
  "/sync",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { githubId, email, name, avatarUrl } = req.body;

      if (!githubId || typeof githubId !== "string") {
        throw new AppError("githubId is required", 400);
      }

      const user = await upsertUser({
        githubId: githubId.toString(),
        email: email ?? null,
        name: name ?? null,
        avatarUrl: avatarUrl ?? null,
      });

      res.json({
        success: true,
        userId: user?.id ?? null,
        dbEnabled: user !== null,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/auth/feedback
 * Body: { userId, analysisId?, messageId?, rating?, helpful?, comment? }
 */
router.post(
  "/feedback",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, analysisId, messageId, rating, helpful, comment } =
        req.body;

      if (!userId || typeof userId !== "string") {
        throw new AppError("userId is required", 400);
      }

      // Validate rating range if provided
      if (rating !== undefined && rating !== null) {
        const r = Number(rating);
        if (!Number.isInteger(r) || r < 1 || r > 5) {
          throw new AppError("rating must be an integer between 1 and 5", 400);
        }
      }

      await saveFeedback({
        userId,
        analysisId: analysisId ?? null,
        messageId: messageId ?? null,
        rating: rating ?? null,
        helpful: helpful ?? null,
        comment: comment ?? null,
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
