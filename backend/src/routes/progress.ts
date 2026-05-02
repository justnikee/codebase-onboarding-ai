/**
 * Progress API Routes
 * Server-Sent Events (SSE) for real-time progress updates
 */

import express, { Request, Response } from 'express';
import { progressService } from '../services/progress.js';

const router = express.Router();

/**
 * GET /api/progress/:contextId
 * Stream progress updates using Server-Sent Events
 */
router.get('/:contextId', (req: Request, res: Response) => {
  const { contextId } = req.params;

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', contextId })}\n\n`);

  // Send existing progress
  const existingProgress = progressService.getProgress(contextId);
  existingProgress.forEach(update => {
    res.write(`data: ${JSON.stringify({ type: 'progress', ...update })}\n\n`);
  });

  // Subscribe to new progress updates
  const unsubscribe = progressService.subscribeToProgress(contextId, (update) => {
    res.write(`data: ${JSON.stringify({ type: 'progress', ...update })}\n\n`);
    
    // Close connection when complete
    if (update.progress >= 100) {
      setTimeout(() => {
        res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
        res.end();
      }, 1000);
    }
  });

  // Handle client disconnect
  req.on('close', () => {
    unsubscribe();
    res.end();
  });
});

export default router;

// Made with Bob
