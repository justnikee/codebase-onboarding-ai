# 🚀 AI Developer Onboarding Assistant

An intelligent tool that analyzes GitHub repositories and generates personalized onboarding content using IBM watsonx and Bob AI.

## ✨ Features

- 📊 **Automatic Repo Analysis** - Paste any GitHub URL and get instant insights
- 🎯 **Smart Context Extraction** - Understands project structure, tech stack, and key files
- 📝 **Auto-Generated Documentation** - Creates setup guides and architecture explanations
- 💬 **Context-Aware Chatbot** - Ask questions and get repo-specific answers (not generic AI responses)
- 🧠 **Powered by IBM watsonx** - Enhanced reasoning and context-aware responses

## 🏗️ Architecture

```
ai-onboarding-assistant/
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   │   ├── github.ts   # GitHub API integration
│   │   │   ├── context.ts  # Context extraction
│   │   │   ├── ibm-bob.ts  # IBM Bob integration
│   │   │   └── watsonx.ts  # watsonx integration
│   │   ├── utils/          # Helper functions
│   │   └── storage/        # Context JSON storage
│   └── package.json
│
├── frontend/               # Next.js + TypeScript + Tailwind
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   └── services/      # API client
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- IBM Cloud account with watsonx access
- GitHub account (optional, for higher API rate limits)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai-onboarding-assistant
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and add your IBM credentials
# IBM_WATSONX_API_KEY=your_key_here
# IBM_WATSONX_PROJECT_ID=your_project_id

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy environment variables
cp .env.local.example .env.local

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🔧 Configuration

### Backend Environment Variables

```env
PORT=5000
IBM_WATSONX_API_KEY=your_watsonx_api_key
IBM_WATSONX_PROJECT_ID=your_project_id
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com
GITHUB_TOKEN=your_github_token (optional)
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## 📖 Usage

1. **Enter Repository URL**
   - Paste any public GitHub repository URL
   - Click "Analyze Repository"

2. **View Generated Content**
   - Project summary
   - Setup instructions
   - Architecture explanation
   - Tech stack analysis

3. **Ask Questions**
   - Use the chat interface to ask repo-specific questions
   - Get answers grounded in actual project context
   - Example: "Where is authentication handled?"

## 🎯 Key Differentiator

Unlike generic AI assistants, our chatbot provides **context-aware answers** by:

1. Extracting and indexing repository structure
2. Creating a knowledge base of file summaries
3. Searching relevant context for each question
4. Using watsonx to generate answers based ONLY on project context

**Result:** Specific, accurate answers instead of generic advice.

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **AI:** IBM watsonx + IBM Bob
- **APIs:** GitHub REST API
- **Storage:** JSON files (simple & fast)

### Frontend
- **Framework:** Next.js 14 with TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **HTTP Client:** Axios

## 📝 API Endpoints

### POST `/api/analyze`
Analyze a GitHub repository

**Request:**
```json
{
  "repoUrl": "https://github.com/user/repo"
}
```

**Response:**
```json
{
  "contextId": "unique-id",
  "summary": "Project summary...",
  "setupSteps": ["step1", "step2"],
  "architecture": "Architecture explanation...",
  "techStack": ["Node.js", "React"]
}
```

### POST `/api/chat`
Ask questions about a repository

**Request:**
```json
{
  "contextId": "unique-id",
  "question": "Where is authentication handled?"
}
```

**Response:**
```json
{
  "answer": "Authentication is handled in src/auth.ts...",
  "relevantFiles": ["src/auth.ts"]
}
```

## 🧪 Testing

Test with diverse repositories:
- Node.js projects (Express, Next.js)
- Python projects (Django, Flask)
- React applications
- Full-stack applications

## 🎬 Demo Video

[Link to demo video showcasing the context-aware chatbot]

## 📄 License

MIT

## 🙏 Acknowledgments

- IBM watsonx for AI capabilities
- IBM Bob for content generation
- GitHub API for repository data

## 👥 Contributing

This is a hackathon project. Contributions welcome!

## 📧 Contact

[Your contact information]