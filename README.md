# DevBoard — AI Developer Onboarding Assistant

Paste a GitHub URL (or upload a local folder) and instantly understand any codebase — architecture, tech stack, setup steps, and a context-aware AI chat. Built with IBM watsonx Granite (`ibm/granite-3-8b-instruct`) for the IBM Bob Dev Day Hackathon 2026.

---

## What it does

New developers spend days just figuring out how a codebase works. DevBoard eliminates that. In seconds you get:

- **Project summary** — what the repo does, who it's for, key features
- **Architecture graph** — interactive force-directed dependency visualization
- **Language breakdown** — tech stack with percentage breakdown
- **Setup guide** — step-by-step instructions generated from actual config files
- **Onboarding impact** — time saved estimates before vs after using DevBoard
- **Context-aware chat** — ask anything about the code, get answers with file references

Unlike a generic AI assistant, the chatbot answers from the actual repo context — not the internet.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript (ESM) |
| AI | IBM watsonx (`ibm/granite-3-8b-instruct`) |
| Auth | NextAuth.js (GitHub OAuth) |
| MCP | `@modelcontextprotocol/sdk` — exposes DevBoard as AI tools |

---

## Project Structure

```
BOB/
├── frontend/          # Next.js app (port 3000)
│   └── src/
│       ├── app/       # App Router pages (home, analyze, chat, dashboard)
│       ├── components/  # UI components + ArchitectureGraph
│       └── services/  # API client
├── backend/           # Express API (port 5000)
│   └── src/
│       ├── routes/    # analyze, chat, insights, progress, upload
│       └── services/  # watsonx, github, context, cache, local-folder
└── mcp-server/        # MCP server — exposes DevBoard as AI tool calls
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- IBM watsonx API key + Project ID
- GitHub OAuth app (optional — for higher rate limits)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npx tsx src/server.ts
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

### Backend `.env`

```env
PORT=5000
IBM_WATSONX_API_KEY=your_key
IBM_WATSONX_PROJECT_ID=your_project_id
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com
GITHUB_TOKEN=optional
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any_random_string
GITHUB_CLIENT_ID=optional
GITHUB_CLIENT_SECRET=optional
```

---

## MCP Server

DevBoard ships as a Model Context Protocol server so any MCP-compatible AI (Cursor, Claude Desktop) can call DevBoard analysis tools directly.

```bash
cd mcp-server
npm install && npm run build
```

**Available tools:** `analyze_repository`, `get_analysis`, `chat_with_repo`, `get_first_tasks`, `get_architecture_graph`

Configure in your MCP client:
```json
{
  "mcpServers": {
    "devboard": {
      "command": "node",
      "args": ["path/to/mcp-server/build/index.js"],
      "env": { "BOB_API_URL": "http://localhost:5000/api" }
    }
  }
}
```

---

## Key Features

**Deep Scan** — toggle on the analyze page to scan up to 300 files (vs 50 default) for larger repos.

**Local folder upload** — upload any local project folder, scans up to depth 10 / 500 files with no rate limits.

**Streaming responses** — chat answers stream token-by-token via SSE.

**Caching** — analyzed repos are cached so repeat visits are instant.

---

## IBM Bob and watsonx Usage

- All AI analysis and chat responses use `ibm/granite-3-8b-instruct` via the watsonx.ai Inference API
- IBM Bob was used throughout development for code generation, debugging, and architecture decisions
- The exported IBM Bob session report is included in `bob_sessions/`

---

## License

MIT
