/**
 * Chat Routes
 */

import { Router, Request, Response, NextFunction } from "express";
import { chatService } from "../services/chat.js";
import { AppError, ChatRequest } from "../types/index.js";
import {
  saveChatMessage,
  getAnalysisIdByContextId,
} from "../services/database.js";

const router = Router();

/**
 * POST /api/chat
 * Processes a chat question with repository context
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contextId, question, conversationHistory } = req.body;

    if (!contextId) {
      throw new AppError("Context ID is required", 400);
    }

    if (!question) {
      throw new AppError("Question is required", 400);
    }

    const userId = (req as any).userId as string | null;

    const chatRequest: ChatRequest = {
      contextId,
      question,
      conversationHistory: conversationHistory || [],
    };

    const response = await chatService.processQuestion(chatRequest);

    // Persist chat messages if user is authenticated
    if (userId) {
      const analysisId = await getAnalysisIdByContextId(contextId);
      if (analysisId) {
        await saveChatMessage({
          analysisId,
          userId,
          role: "user",
          content: question,
        });
        await saveChatMessage({
          analysisId,
          userId,
          role: "assistant",
          content: response.answer,
          relevantFiles: response.relevantFiles ?? [],
          confidence: response.confidence ?? null,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/chat/suggestions/:contextId
 * Gets suggested questions for a repository
 */
router.get(
  "/suggestions/:contextId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contextId } = req.params;

      const suggestions =
        await chatService.generateSuggestedQuestions(contextId);

      res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

// Made with Bob
