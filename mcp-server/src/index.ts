import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// Target BOB backend running locally
const API_BASE_URL = process.env.BOB_API_URL || "http://localhost:5000/api";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional token if required

const server = new Server(
  {
    name: "bob-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Helper to make API requests with optional authentication
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

if (GITHUB_TOKEN) {
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "analyze_repository",
        description: "Analyze a GitHub repository to generate an onboarding summary, architecture, and context.",
        inputSchema: {
          type: "object",
          properties: {
            repoUrl: {
              type: "string",
              description: "The full GitHub repository URL (e.g., https://github.com/owner/repo)",
            },
          },
          required: ["repoUrl"],
        },
      },
      {
        name: "get_analysis",
        description: "Retrieve a previously generated repository analysis using its contextId.",
        inputSchema: {
          type: "object",
          properties: {
            contextId: {
              type: "string",
              description: "The unique contextId returned from analyze_repository",
            },
          },
          required: ["contextId"],
        },
      },
      {
        name: "chat_with_repo",
        description: "Ask a question about a repository using its contextId.",
        inputSchema: {
          type: "object",
          properties: {
            contextId: {
              type: "string",
              description: "The unique contextId of the analyzed repository",
            },
            question: {
              type: "string",
              description: "The question to ask about the codebase",
            },
          },
          required: ["contextId", "question"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "analyze_repository": {
      const { repoUrl } = request.params.arguments as { repoUrl: string };
      try {
        const response = await apiClient.post("/analyze", { repoUrl });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error analyzing repository: ${error.response?.data?.message || error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "get_analysis": {
      const { contextId } = request.params.arguments as { contextId: string };
      try {
        const response = await apiClient.get(`/analyze/${contextId}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching analysis: ${error.response?.data?.message || error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "chat_with_repo": {
      const { contextId, question } = request.params.arguments as { contextId: string; question: string };
      try {
        const response = await apiClient.post("/chat", { contextId, question });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error chatting with repository: ${error.response?.data?.message || error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    default:
      throw new Error("Unknown tool");
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BOB MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
