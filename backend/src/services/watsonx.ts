/**
 * IBM watsonx.ai Service
 * Handles AI generation and reasoning using IBM watsonx
 */

import axios, { AxiosInstance } from "axios";
import {
  WatsonXError,
  WatsonXConfig,
  WatsonXGenerationParams,
} from "../types/index.js";
import { retryWithBackoff } from "../utils/helpers.js";
import { mockWatsonxService } from "./watsonx-mock.js";

class WatsonXService {
  private client: AxiosInstance;
  private config: WatsonXConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      apiKey: process.env.IBM_WATSONX_API_KEY || "",
      projectId: process.env.IBM_WATSONX_PROJECT_ID || "",
      url: process.env.IBM_WATSONX_URL || "https://us-south.ml.cloud.ibm.com",
    };

    this.client = axios.create({
      baseURL: this.config.url,
      timeout: 60000, // 60 seconds for AI generation
    });

    // Log configuration on startup
    console.log("🔧 WatsonX Service Configuration:");
    console.log(`   USE_MOCK_WATSONX: ${process.env.USE_MOCK_WATSONX}`);
    console.log(
      `   API Key present: ${this.config.apiKey ? "YES ✅" : "NO ❌"}`,
    );
    console.log(`   Project ID: ${this.config.projectId}`);
    console.log(`   URL: ${this.config.url}`);
  }

  /**
   * Check if we should use mock service
   */
  private shouldUseMock(): boolean {
    return process.env.USE_MOCK_WATSONX === "true" || !this.config.apiKey;
  }

  /**
   * Gets or refreshes the IBM Cloud IAM access token
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (with 5 minute buffer)
    if (this.accessToken && this.tokenExpiry > now + 300000) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        "https://iam.cloud.ibm.com/identity/token",
        new URLSearchParams({
          grant_type: "urn:ibm:params:oauth:grant-type:apikey",
          apikey: this.config.apiKey,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = now + response.data.expires_in * 1000;

      if (!this.accessToken) {
        throw new WatsonXError("Failed to obtain access token", 401);
      }

      return this.accessToken;
    } catch (error) {
      throw new WatsonXError(
        `Failed to authenticate with IBM Cloud: ${error instanceof Error ? error.message : "Unknown error"}`,
        401,
      );
    }
  }

  /**
   * Generates text using watsonx.ai
   */
  async generate(params: WatsonXGenerationParams): Promise<string> {
    // Use mock service if configured
    if (this.shouldUseMock()) {
      console.warn(
        "⚠️  Using MOCK watsonx service - Set IBM_WATSONX_API_KEY to use real API",
      );
      return mockWatsonxService.generate(params);
    }

    console.log("✅ Using REAL IBM watsonx.ai API");
    try {
      const token = await this.getAccessToken();

      const payload = {
        model_id: params.model || "ibm/granite-3-8b-instruct",
        input: params.prompt,
        parameters: {
          max_new_tokens: params.maxTokens || 2000,
          temperature: params.temperature || 0.7,
          top_p: params.topP || 1,
          top_k: params.topK || 50,
          repetition_penalty: 1.1,
          stop_sequences: ["</s>", "<|endoftext|>"],
        },
        project_id: this.config.projectId,
      };

      const response = await retryWithBackoff(
        async () => {
          return await this.client.post("/ml/v1/text/generation", payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            params: {
              version: "2023-05-29",
            },
          });
        },
        3,
        2000,
      );

      const generatedText = response.data.results?.[0]?.generated_text;

      if (!generatedText) {
        throw new WatsonXError("No text generated from watsonx", 500);
      }

      return generatedText.trim();
    } catch (error) {
      if (error instanceof WatsonXError) {
        throw error;
      }

      const axiosStatus = (error as any)?.response?.status;
      const axiosBody = (error as any)?.response?.data;

      if (axiosStatus === 403 || axiosStatus === 401) {
        console.warn(
          `⚠️  IBM WatsonX returned ${axiosStatus} — falling back to mock.`,
        );
        console.warn(
          `   Check: project ID is correct and API key has WatsonX access.`,
        );
        if (axiosBody) console.warn(`   IBM error:`, JSON.stringify(axiosBody));
        return mockWatsonxService.generate(params);
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      throw new WatsonXError(`watsonx generation failed: ${message}`, 500);
    }
  }

  /**
   * Generates a project summary from repository context
   */
  async generateProjectSummary(
    repoName: string,
    description: string | null,
    readme: string | null,
    techStack: string[],
  ): Promise<string> {
    const prompt = `You are an expert software engineer analyzing a GitHub repository.

Repository: ${repoName}
Description: ${description || "No description provided"}
Tech Stack: ${techStack.join(", ") || "Unknown"}

README excerpt:
${readme ? readme.substring(0, 2000) : "No README available"}

Task: Write a clear, concise summary (3-4 sentences) explaining:
1. What this project does
2. Who would use it
3. Key features or capabilities

Summary:`;

    return await this.generate({
      model: "ibm/granite-3-8b-instruct",
      prompt,
      maxTokens: 500,
      temperature: 0.7,
    });
  }

  /**
   * Generates setup instructions
   */
  async generateSetupGuide(
    repoName: string,
    packageJson: string | null,
    requirementsTxt: string | null,
    readme: string | null,
  ): Promise<string[]> {
    const prompt = `You are an expert developer creating setup instructions for a repository.

Repository: ${repoName}

${packageJson ? `package.json:\n${packageJson.substring(0, 1000)}` : ""}
${requirementsTxt ? `requirements.txt:\n${requirementsTxt.substring(0, 500)}` : ""}
${readme ? `README excerpt:\n${readme.substring(0, 1500)}` : ""}

Task: Generate 6-8 specific, actionable setup steps. Each step must be a complete, concrete action — NOT a section heading.
Rules:
- Each step starts with a verb (Install, Clone, Run, Set, Copy, Configure, Open, etc.)
- Include the actual command, tool name, or URL where relevant
- Do NOT use bare category names like "Prerequisites:" or "Installation:" as steps
- Format: "1. [action verb] [specific instruction with details]"
Good examples:
  1. Install Node.js 18+ from https://nodejs.org and verify with node --version
  2. Clone the repository: git clone <url> && cd ${repoName}
  3. Run npm install to install all dependencies
  4. Copy .env.example to .env and fill in your API keys

Setup Steps:`;

    const response = await this.generate({
      model: "ibm/granite-3-8b-instruct",
      prompt,
      maxTokens: 800,
      temperature: 0.5,
    });

    // Parse response into array of steps
    return response
      .split("\n")
      .filter((line) => line.trim().match(/^\d+\./))
      .map((line) => line.trim());
  }

  /**
   * Generates architecture explanation
   */
  async generateArchitectureExplanation(
    repoName: string,
    fileStructure: string[],
    techStack: string[],
  ): Promise<string> {
    const prompt = `You are a software architect explaining a project's structure.

Repository: ${repoName}
Tech Stack: ${techStack.join(", ")}

Key files and directories:
${fileStructure.slice(0, 30).join("\n")}

Task: Explain the project architecture in 2-3 paragraphs:
1. Overall structure and organization
2. How different components interact
3. Key architectural patterns used

Architecture:`;

    return await this.generate({
      model: "ibm/granite-3-8b-instruct",
      prompt,
      maxTokens: 600,
      temperature: 0.6,
    });
  }

  /**
   * Generates a file summary for context building
   */
  async generateFileSummary(
    filename: string,
    content: string,
    maxLength: number = 500,
  ): Promise<string> {
    const truncatedContent = content.substring(0, 3000);

    const prompt = `Summarize this code file in 1-2 sentences. Focus on its purpose and key functionality.

File: ${filename}

Code:
${truncatedContent}

Summary:`;

    return await this.generate({
      model: "ibm/granite-3-8b-instruct",
      prompt,
      maxTokens: 150,
      temperature: 0.5,
    });
  }

  /**
   * Answers a question using repository context
   */
  async answerQuestion(
    question: string,
    relevantContext: Array<{ path: string; summary: string }>,
    repoName: string,
  ): Promise<string> {
    const contextText = relevantContext
      .map((ctx) => `- ${ctx.path}: ${ctx.summary}`)
      .join("\n");

    const prompt = `You are an AI assistant helping developers understand the ${repoName} repository.

Relevant code context:
${contextText}

User question: ${question}

Instructions:
- Answer based ONLY on the provided context
- Be specific and reference file paths when relevant
- If the context doesn't contain enough information, say so clearly
- Keep the answer concise and practical

Answer:`;

    return await this.generate({
      model: "ibm/granite-3-8b-instruct",
      prompt,
      maxTokens: 500,
      temperature: 0.6,
    });
  }

  /**
   * Enhanced answer with conversation memory and actual code
   */
  async answerQuestionWithMemory(
    question: string,
    fileContents: Array<{ path: string; content: string; summary: string }>,
    repoName: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    readme: string = "",
    projectSummary: string = "",
    projectArchitecture: string = "",
  ): Promise<string> {
    // Build conversation context (last 3 exchanges = 6 messages)
    const historyText = conversationHistory
      .slice(-6)
      .map(
        (msg) =>
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`,
      )
      .join("\n\n");

    // Build file context with actual code snippets
    const filesText = fileContents
      .map(
        (f) => `
File: ${f.path}
Purpose: ${f.summary}

Code:
\`\`\`
${f.content}
\`\`\`
      `,
      )
      .join("\n---\n");

    // Use project summary as primary context if available, fall back to readme
    const overviewText = projectSummary
      ? projectSummary
      : readme.substring(0, 800);

    const prompt = `You are an expert developer assistant with deep knowledge of the ${repoName} codebase. Answer questions with specific, grounded information from the actual project — never give generic advice.

PROJECT SUMMARY:
${overviewText}
${projectArchitecture ? `\nARCHITECTURE:\n${projectArchitecture.substring(0, 600)}\n` : ""}
RELEVANT CODE FILES:
${filesText}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ""}
QUESTION: ${question}

RULES:
- Answer specifically about ${repoName}, not in general terms
- Reference exact file paths and code snippets from above
- If you see specific functions/classes/configs in the code, mention them by name
- Build on the conversation history if this is a follow-up
- Keep answers concise and actionable (2-3 paragraphs max)
- Use \`code formatting\` for file paths and variable names
- If the code above doesn't cover something, say what you DO know from the project context

ANSWER:`;

    return await this.generate({
      model: "ibm/granite-3-8b-instruct",
      prompt,
      maxTokens: 800,
      temperature: 0.4, // Lower temperature for more consistent responses
      topP: 0.9,
      topK: 40,
    });
  }

  /**
   * Detects tech stack from file names and content
   */
  async detectTechStack(
    files: string[],
    packageJson: string | null,
    requirementsTxt: string | null,
  ): Promise<{
    languages: string[];
    frameworks: string[];
    tools: string[];
  }> {
    const prompt = `Analyze these files and dependencies to identify the tech stack.

Files: ${files.slice(0, 50).join(", ")}
${packageJson ? `\npackage.json dependencies: ${packageJson.substring(0, 500)}` : ""}
${requirementsTxt ? `\nrequirements.txt: ${requirementsTxt.substring(0, 300)}` : ""}

Task: List the tech stack in this exact format:
Languages: [comma-separated list]
Frameworks: [comma-separated list]
Tools: [comma-separated list]

Tech Stack:`;

    const response = await this.generate({
      model: "ibm/granite-3-8b-instruct",
      prompt,
      maxTokens: 300,
      temperature: 0.3,
    });

    // Parse response
    const languages = this.extractList(response, "Languages:");
    const frameworks = this.extractList(response, "Frameworks:");
    const tools = this.extractList(response, "Tools:");

    return { languages, frameworks, tools };
  }

  /**
   * Helper to extract lists from formatted text
   */
  private extractList(text: string, label: string): string[] {
    const regex = new RegExp(`${label}\\s*([^\\n]+)`, "i");
    const match = text.match(regex);

    if (!match) return [];

    return match[1]
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && item !== "None" && item !== "N/A");
  }

  /**
   * Generates a "First Tasks" onboarding plan for a new developer
   */
  async generateFirstTasks(params: {
    repoName: string;
    summary: string;
    architecture: string;
    techStack: string[];
    fileList: string[];
    setupSteps: string[];
  }): Promise<FirstTaskPlan> {
    if (this.shouldUseMock()) {
      return mockFirstTaskPlan(params.repoName, params.techStack);
    }

    const prompt = `You are an expert engineering mentor helping a new developer get productive in the "${params.repoName}" codebase.

Tech Stack: ${params.techStack.join(", ")}
Project Summary: ${params.summary}
Architecture: ${params.architecture?.substring(0, 600) ?? "Not available"}
Key Files (first 30): ${params.fileList.slice(0, 30).join(", ")}
Setup Steps: ${params.setupSteps.join("; ")}

Create a focused "Getting Started" plan. Respond with ONLY valid JSON, no markdown, no explanation:
{
  "filesToRead": ["file1", "file2", "file3", "file4", "file5"],
  "entryPoints": ["file1", "file2"],
  "starterTask": {
    "title": "short task title",
    "description": "1-2 sentence description of what to do",
    "files": ["file1", "file2"],
    "why": "why this is a safe first task"
  },
  "learningPath": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
  "quickWins": ["Quick win 1 (e.g. run tests)", "Quick win 2", "Quick win 3"]
}`;

    try {
      const raw = await this.generate({
        model: "ibm/granite-3-8b-instruct",
        prompt,
        maxTokens: 700,
        temperature: 0.3,
      });

      // Extract JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const parsed = JSON.parse(jsonMatch[0]) as FirstTaskPlan;
      // Ensure all required fields
      return {
        filesToRead: parsed.filesToRead ?? [],
        entryPoints: parsed.entryPoints ?? [],
        starterTask: parsed.starterTask ?? {
          title: "",
          description: "",
          files: [],
          why: "",
        },
        learningPath: parsed.learningPath ?? [],
        quickWins: parsed.quickWins ?? [],
      };
    } catch (err) {
      console.error("generateFirstTasks fallback to mock:", err);
      return mockFirstTaskPlan(params.repoName, params.techStack);
    }
  }
}

export interface FirstTaskPlan {
  filesToRead: string[];
  entryPoints: string[];
  starterTask: {
    title: string;
    description: string;
    files: string[];
    why: string;
  };
  learningPath: string[];
  quickWins: string[];
}

function mockFirstTaskPlan(
  repoName: string,
  techStack: string[],
): FirstTaskPlan {
  return {
    filesToRead: [
      "README.md",
      "package.json",
      "src/index.ts",
      "src/app.ts",
      "src/server.ts",
    ].slice(0, 5),
    entryPoints: ["src/index.ts", "src/server.ts"],
    starterTask: {
      title: "Run the project locally and explore the main entry point",
      description: `Follow the setup guide to start ${repoName} locally, then open the main entry file and trace the request flow.`,
      files: ["README.md", "src/index.ts"],
      why: "This is always safe — you are reading code, not changing it, and it builds a mental model of the whole system.",
    },
    learningPath:
      techStack.slice(0, 4).length > 0
        ? techStack.slice(0, 4)
        : [
            "Project architecture",
            "Core data models",
            "API contracts",
            "Test suite",
          ],
    quickWins: [
      "Run the test suite and confirm all tests pass",
      "Make a small documentation improvement",
      "Add a console.log to trace a request end-to-end",
    ],
  };
}

// Export singleton instance
export const watsonxService = new WatsonXService();

// Made with Bob
