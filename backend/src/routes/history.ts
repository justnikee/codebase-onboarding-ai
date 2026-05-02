/**
 * History Routes
 * GET /api/history – return the signed-in user's past analyses
 * GET /api/history/:contextId/chat – return persisted chat messages for an analysis
 */

import { Router, Request, Response, NextFunction } from "express";
import {
  getUserHistory,
  getChatHistory,
  getAnalysisIdByContextId,
} from "../services/database.js";
import { AppError } from "../types/index.js";

const router = Router();

/**
 * GET /api/history
 * Header: X-User-ID: <supabase-user-uuid>
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers["x-user-id"] as string | undefined;

    if (!userId) {
      throw new AppError(
        "Authentication required – send X-User-ID header",
        401,
      );
    }

    const history = await getUserHistory(userId);

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/history/:contextId/chat
 * Returns persisted chat messages for a prior analysis session.
 */
router.get(
  "/:contextId/chat",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contextId } = req.params;
      const userId = req.headers["x-user-id"] as string | undefined;

      if (!userId) {
        throw new AppError(
          "Authentication required – send X-User-ID header",
          401,
        );
      }

      const analysisId = await getAnalysisIdByContextId(contextId);
      if (!analysisId) {
        return res.json({ success: true, data: [] });
      }

      const messages = await getChatHistory(analysisId);

      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
