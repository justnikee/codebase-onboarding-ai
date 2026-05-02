/**
 * Chat Service
 * Handles context-aware conversations about repositories
 */

import { ChatRequest, ChatResponse, ChatMessage } from "../types/index.js";
import { contextService } from "./context.js";
import { watsonxService } from "./watsonx.js";
import { githubService } from "./github.js";
import { validateContextId, validateQuestion } from "../utils/validators.js";

class ChatService {
  /**
   * Processes a chat question with repository context
   */
  async processQuestion(request: ChatRequest): Promise<ChatResponse> {
    // Validate inputs
    const contextId = validateContextId(request.contextId);
    const question = validateQuestion(request.question);
    const conversationHistory = request.conversationHistory || [];

    // Load repository context
    const context = await contextService.loadContext(contextId);

    if (!context) {
      throw new Error(
        "Repository context not found. Please analyze the repository first.",
      );
    }

    // Search for relevant files based on the question
    let relevantFiles = contextService.searchRelevantFiles(
      context,
      question,
      5,
    );

    if (relevantFiles.length === 0) {
      // Fallback: use top important files so we always have grounded context
      relevantFiles = context.files
        .filter((f) => f.importance === "high" || f.importance === "medium")
        .slice(0, 4)
        .map((f) => ({ path: f.path, summary: f.summary, score: 0.1 }));

      // Last resort: just use any files
      if (relevantFiles.length === 0) {
        relevantFiles = context.files
          .slice(0, 3)
          .map((f) => ({ path: f.path, summary: f.summary, score: 0.05 }));
      }
    }

    // Get actual file contents (not just summaries!)
    const fileContents = await this.getFileContents(context, relevantFiles);

    // Generate answer with memory, actual code, and project-level context
    const answer = await watsonxService.answerQuestionWithMemory(
      question,
      fileContents,
      context.metadata.name,
      conversationHistory,
      context.readme || "",
      context.summary || "",
      context.architecture || "",
    );

    // Determine confidence based on relevance scores
    const avgScore =
      relevantFiles.reduce((sum, f) => sum + f.score, 0) / relevantFiles.length;
    const confidence =
      avgScore > 0.5 ? "high" : avgScore > 0.2 ? "medium" : "low";

    return {
      answer: answer.trim(),
      relevantFiles: relevantFiles.map((f) => f.path),
      confidence,
      sources: relevantFiles.map((f) => f.path),
    };
  }

  /**
   * Get actual file contents (not just summaries)
   */
  private async getFileContents(
    context: any,
    relevantFiles: Array<{ path: string; summary: string; score: number }>,
  ): Promise<Array<{ path: string; content: string; summary: string }>> {
    const contents = [];

    // Get top 3 most relevant files
    for (const file of relevantFiles.slice(0, 3)) {
      try {
        // Try to get from keyFiles first (already loaded)
        let content = context.keyFiles[file.path];

        // If not in keyFiles, try to fetch from GitHub
        if (!content && context.repoUrl.includes("github.com")) {
          content = await githubService.getFileContent(
            context.repoUrl,
            file.path,
          );
        }

        if (content) {
          contents.push({
            path: file.path,
            content: content.substring(0, 2000), // Limit to 2000 chars
            summary: file.summary,
          });
        }
      } catch (error) {
        console.warn(`Failed to get content for ${file.path}:`, error);
        // Still include the summary
        contents.push({
          path: file.path,
          content: `[Content not available]\n\nSummary: ${file.summary}`,
          summary: file.summary,
        });
      }
    }

    return contents;
  }

  /**
   * Generates suggested questions based on repository context
   */
  async generateSuggestedQuestions(contextId: string): Promise<string[]> {
    const context = await contextService.loadContext(contextId);

    if (!context) {
      return [];
    }

    const suggestions: string[] = [
      "How do I set up this project?",
      "What is the main purpose of this project?",
      "What technologies does this project use?",
    ];

    // Add context-specific suggestions
    if (context.files.some((f) => f.path.includes("auth"))) {
      suggestions.push("How does authentication work?");
    }

    if (
      context.files.some(
        (f) => f.path.includes("api") || f.path.includes("route"),
      )
    ) {
      suggestions.push("What API endpoints are available?");
    }

    if (context.files.some((f) => f.path.includes("test"))) {
      suggestions.push("How do I run the tests?");
    }

    if (context.files.some((f) => f.path.includes("config"))) {
      suggestions.push("What configuration options are available?");
    }

    if (
      context.files.some(
        (f) => f.path.includes("database") || f.path.includes("db"),
      )
    ) {
      suggestions.push("How is the database structured?");
    }

    return suggestions.slice(0, 6);
  }

  /**
   * Formats conversation history for context
   */
  formatConversationHistory(messages: ChatMessage[]): string {
    return messages
      .map(
        (msg) =>
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`,
      )
      .join("\n");
  }

  /**
   * Validates and sanitizes chat message
   */
  validateMessage(message: string): string {
    const sanitized = message.trim();

    if (sanitized.length === 0) {
      throw new Error("Message cannot be empty");
    }

    if (sanitized.length > 2000) {
      throw new Error("Message is too long (max 2000 characters)");
    }

    return sanitized;
  }
}

// Export singleton instance
export const chatService = new ChatService();

// Made with Bob
