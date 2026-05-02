/**
 * Progress Tracking Service
 * Provides real-time progress updates during repository analysis
 */

import { EventEmitter } from 'events';

export interface ProgressUpdate {
  step: string;
  progress: number; // 0-100
  message: string;
  timestamp: string;
}

class ProgressService extends EventEmitter {
  private progressMap: Map<string, ProgressUpdate[]> = new Map();

  /**
   * Emit progress update for a context
   */
  updateProgress(contextId: string, step: string, progress: number, message: string): void {
    const update: ProgressUpdate = {
      step,
      progress,
      message,
      timestamp: new Date().toISOString(),
    };

    // Store progress
    if (!this.progressMap.has(contextId)) {
      this.progressMap.set(contextId, []);
    }
    this.progressMap.get(contextId)!.push(update);

    // Emit event
    this.emit(`progress:${contextId}`, update);
    
    // Log to console
    console.log(`[${progress}%] ${step}: ${message}`);
  }

  /**
   * Get all progress updates for a context
   */
  getProgress(contextId: string): ProgressUpdate[] {
    return this.progressMap.get(contextId) || [];
  }

  /**
   * Clear progress for a context
   */
  clearProgress(contextId: string): void {
    this.progressMap.delete(contextId);
  }

  /**
   * Subscribe to progress updates
   */
  subscribeToProgress(contextId: string, callback: (update: ProgressUpdate) => void): () => void {
    const listener = (update: ProgressUpdate) => callback(update);
    this.on(`progress:${contextId}`, listener);
    
    // Return unsubscribe function
    return () => {
      this.off(`progress:${contextId}`, listener);
    };
  }
}

export const progressService = new ProgressService();

// Made with Bob
