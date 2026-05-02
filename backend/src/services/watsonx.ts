/**
 * IBM watsonx.ai Service
 * Handles AI generation and reasoning using IBM watsonx
 */

import axios, { AxiosInstance } from 'axios';
import { WatsonXError, WatsonXConfig, WatsonXGenerationParams } from '../types/index.js';
import { retryWithBackoff } from '../utils/helpers.js';
import { mockWatsonxService } from './watsonx-mock.js';

class WatsonXService {
  private client: AxiosInstance;
  private config: WatsonXConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      apiKey: process.env.IBM_WATSONX_API_KEY || '',
      projectId: process.env.IBM_WATSONX_PROJECT_ID || '',
      url: process.env.IBM_WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
    };

    this.client = axios.create({
      baseURL: this.config.url,
      timeout: 60000, // 60 seconds for AI generation
    });

    // Log configuration on startup
    console.log('🔧 WatsonX Service Configuration:');
    console.log(`   USE_MOCK_WATSONX: ${process.env.USE_MOCK_WATSONX}`);
    console.log(`   API Key present: ${this.config.apiKey ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Project ID: ${this.config.projectId}`);
    console.log(`   URL: ${this.config.url}`);
  }

  /**
   * Check if we should use mock service
   */
  private shouldUseMock(): boolean {
    return process.env.USE_MOCK_WATSONX === 'true' || !this.config.apiKey;
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
        'https://iam.cloud.ibm.com/identity/token',
        new URLSearchParams({
          grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
          apikey: this.config.apiKey,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
  
      this.accessToken = response.data.access_token;
      this.tokenExpiry = now + (response.data.expires_in * 1000);
  
      if (!this.accessToken) {
        throw new WatsonXError('Failed to obtain access token', 401);
      }
  
      return this.accessToken;
    } catch (error) {
      throw new WatsonXError(
        `Failed to authenticate with IBM Cloud: ${error instanceof Error ? error.message : 'Unknown error'}`,
        401
      );
    }
  }

  /**
   * Generates text using watsonx.ai
   */
  async generate(params: WatsonXGenerationParams): Promise<string> {
    // Use mock service if configured
    if (this.shouldUseMock()) {
      console.warn('⚠️  Using MOCK watsonx service - Set IBM_WATSONX_API_KEY to use real API');
      return mockWatsonxService.generate(params);
    }

    console.log('✅ Using REAL IBM watsonx.ai API');
    try {
      const token = await this.getAccessToken();

      const payload = {
        model_id: params.model || 'ibm/granite-13b-chat-v2',
        input: params.prompt,
        parameters: {
          max_new_tokens: params.maxTokens || 2000,
          temperature: params.temperature || 0.7,
          top_p: params.topP || 1,
          top_k: params.topK || 50,
          repetition_penalty: 1.1,
          stop_sequences: ['</s>', '<|endoftext|>'],
        },
        project_id: this.config.projectId,
      };

      const response = await retryWithBackoff(
        async () => {
          return await this.client.post('/ml/v1/text/generation', payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            params: {
              version: '2023-05-29',
            },
          });
        },
        3,
        2000
      );

      const generatedText = response.data.results?.[0]?.generated_text;

      if (!generatedText) {
        throw new WatsonXError('No text generated from watsonx', 500);
      }

      return generatedText.trim();
    } catch (error) {
      if (error instanceof WatsonXError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
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
    techStack: string[]
  ): Promise<string> {
    const prompt = `You are an expert software engineer analyzing a GitHub repository.

Repository: ${repoName}
Description: ${description || 'No description provided'}
Tech Stack: ${techStack.join(', ') || 'Unknown'}

README excerpt:
${readme ? readme.substring(0, 2000) : 'No README available'}

Task: Write a clear, concise summary (3-4 sentences) explaining:
1. What this project does
2. Who would use it
3. Key features or capabilities

Summary:`;

    return await this.generate({
      model: 'ibm/granite-13b-chat-v2',
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
    readme: string | null
  ): Promise<string[]> {
    const prompt = `You are an expert developer creating setup instructions for a repository.

Repository: ${repoName}

${packageJson ? `package.json:\n${packageJson.substring(0, 1000)}` : ''}
${requirementsTxt ? `requirements.txt:\n${requirementsTxt.substring(0, 500)}` : ''}
${readme ? `README excerpt:\n${readme.substring(0, 1500)}` : ''}

Task: Generate clear, step-by-step setup instructions. Format as a numbered list.
Include: prerequisites, installation, configuration, and running the project.

Setup Instructions:`;

    const response = await this.generate({
      model: 'ibm/granite-13b-chat-v2',
      prompt,
      maxTokens: 800,
      temperature: 0.5,
    });

    // Parse response into array of steps
    return response
      .split('\n')
      .filter(line => line.trim().match(/^\d+\./))
      .map(line => line.trim());
  }

  /**
   * Generates architecture explanation
   */
  async generateArchitectureExplanation(
    repoName: string,
    fileStructure: string[],
    techStack: string[]
  ): Promise<string> {
    const prompt = `You are a software architect explaining a project's structure.

Repository: ${repoName}
Tech Stack: ${techStack.join(', ')}

Key files and directories:
${fileStructure.slice(0, 30).join('\n')}

Task: Explain the project architecture in 2-3 paragraphs:
1. Overall structure and organization
2. How different components interact
3. Key architectural patterns used

Architecture:`;

    return await this.generate({
      model: 'ibm/granite-13b-chat-v2',
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
    maxLength: number = 500
  ): Promise<string> {
    const truncatedContent = content.substring(0, 3000);

    const prompt = `Summarize this code file in 1-2 sentences. Focus on its purpose and key functionality.

File: ${filename}

Code:
${truncatedContent}

Summary:`;

    return await this.generate({
      model: 'ibm/granite-13b-chat-v2',
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
    repoName: string
  ): Promise<string> {
    const contextText = relevantContext
      .map(ctx => `- ${ctx.path}: ${ctx.summary}`)
      .join('\n');

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
      model: 'ibm/granite-13b-chat-v2',
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
    readme: string = ''
  ): Promise<string> {
    // Build conversation context (last 3 exchanges = 6 messages)
    const historyText = conversationHistory
      .slice(-6)
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    // Build file context with actual code snippets
    const filesText = fileContents
      .map(f => `
File: ${f.path}
Purpose: ${f.summary}

Code:
\`\`\`
${f.content}
\`\`\`
      `)
      .join('\n---\n');

    const prompt = `You are an expert AI assistant helping developers understand the ${repoName} repository.

PROJECT OVERVIEW:
${readme.substring(0, 1000)}

RELEVANT CODE:
${filesText}

${historyText ? `PREVIOUS CONVERSATION:\n${historyText}\n` : ''}

CURRENT QUESTION: ${question}

INSTRUCTIONS:
1. Answer based on the ACTUAL CODE shown above
2. Reference specific files and code snippets
3. If this is a follow-up, build on previous answers
4. Be specific and technical - quote code when helpful
5. If information is missing, say so clearly
6. Keep answers focused (2-4 paragraphs)
7. Use markdown formatting for code

ANSWER:`;

    return await this.generate({
      model: 'ibm/granite-13b-chat-v2',
      prompt,
      maxTokens: 800,
      temperature: 0.4,  // Lower temperature for more consistent responses
      topP: 0.9,
      topK: 40
    });
  }

  /**
   * Detects tech stack from file names and content
   */
  async detectTechStack(
    files: string[],
    packageJson: string | null,
    requirementsTxt: string | null
  ): Promise<{
    languages: string[];
    frameworks: string[];
    tools: string[];
  }> {
    const prompt = `Analyze these files and dependencies to identify the tech stack.

Files: ${files.slice(0, 50).join(', ')}
${packageJson ? `\npackage.json dependencies: ${packageJson.substring(0, 500)}` : ''}
${requirementsTxt ? `\nrequirements.txt: ${requirementsTxt.substring(0, 300)}` : ''}

Task: List the tech stack in this exact format:
Languages: [comma-separated list]
Frameworks: [comma-separated list]
Tools: [comma-separated list]

Tech Stack:`;

    const response = await this.generate({
      model: 'ibm/granite-13b-chat-v2',
      prompt,
      maxTokens: 300,
      temperature: 0.3,
    });

    // Parse response
    const languages = this.extractList(response, 'Languages:');
    const frameworks = this.extractList(response, 'Frameworks:');
    const tools = this.extractList(response, 'Tools:');

    return { languages, frameworks, tools };
  }

  /**
   * Helper to extract lists from formatted text
   */
  private extractList(text: string, label: string): string[] {
    const regex = new RegExp(`${label}\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);

    if (!match) return [];

    return match[1]
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0 && item !== 'None' && item !== 'N/A');
  }
}

// Export singleton instance
export const watsonxService = new WatsonXService();

// Made with Bob
