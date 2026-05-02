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

/**
 * POST /api/chat/stream
 * Streams a chat response as Server-Sent Events (SSE)
 */
router.post(
  "/stream",
  async (req: Request, res: Response, next: NextFunction) => {
    const { contextId, question, conversationHistory } = req.body;

    if (!contextId || !question) {
      res.status(400).json({ error: "contextId and question are required" });
      return;
    }

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
    res.flushHeaders();

    let fullAnswer = "";

    try {
      const chatRequest: ChatRequest = {
        contextId,
        question,
        conversationHistory: conversationHistory || [],
      };

      const { textStream, relevantFiles, confidence } =
        await chatService.processQuestionStream(chatRequest);

      for await (const chunk of textStream) {
        fullAnswer += chunk;
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        // Force flush so the browser receives each chunk immediately
        if (typeof (res as any).flush === "function") (res as any).flush();
      }

      // Send metadata then close
      res.write(
        `data: ${JSON.stringify({ meta: { relevantFiles, confidence } })}\n\n`,
      );
      res.write(`data: [DONE]\n\n`);

      // Persist to DB if authenticated
      const userId = (req as any).userId as string | null;
      if (userId) {
        try {
          const { getAnalysisIdByContextId, saveChatMessage } =
            await import("../services/database.js");
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
              content: fullAnswer.trim(),
              relevantFiles,
              confidence,
            });
          }
        } catch {
          // DB persistence is best-effort; don't break the stream
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    } finally {
      res.end();
    }
  },
);

export default router;
