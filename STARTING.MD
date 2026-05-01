# 🚀 AI Developer Onboarding Assistant (with watsonx) — FULL ROADMAP

## 🎯 Core Idea (Refined)

Build a tool that:

- Takes a GitHub repo
- Understands it (not just reads it)
- Generates:
  - Setup guide
  - Architecture map
  - Personalized onboarding plan
- Lets devs chat with context-aware AI

👉 **Upgrade:** Answers are grounded in repo context using watsonx (not generic AI)

---

## 🧭 PHASE 0 — Scope Lock (CRITICAL)

### ✅ Must-have (Winning scope)

- Repo URL input
- Repo parser (README + structure + key files)
- Context storage (JSON)
- AI-generated:
  - Summary
  - Setup steps
  - Architecture explanation
  - Onboarding plan
- Context-aware chatbot
- Clean UI

### ⭐ New (watsonx edge)

- Context injection (RAG-lite)
- Repo-aware answers
- Smarter onboarding (day-wise plan)

### ❌ Skip

- Auth system
- Real-time sync
- Complex infra
- Vector DB (too heavy for hackathon)

---

## 🧱 PHASE 1 — Project Setup

### 🛠 Tech Stack

#### Frontend

- React (or Next.js)
- Tailwind CSS

#### Backend

- Node.js + Express

#### AI Layer

- IBM Bob → generation + chat
- watsonx.ai → context-aware reasoning

#### Data Layer

- JSON (simple, fast, enough)

---

## 🧠 PHASE 2 — Repo Ingestion + Context Engine (CORE UPGRADE)

### Step 1: Input Repo

User pastes:

https://github.com/user/repo

---

### Step 2: Extract Data

From GitHub API:

- README.md
- File structure
- Key files:
  - package.json
  - requirements.txt
  - config files

---

### Step 3: Build Context JSON (VERY IMPORTANT)

```json
{
  "project": "Sample App",
  "tech_stack": ["Node.js", "Express", "MongoDB"],
  "files": [
    {
      "path": "src/auth.js",
      "summary": "Handles JWT authentication"
    },
    {
      "path": "src/api/user.js",
      "summary": "User API routes"
    }
  ],
  "scripts": {
    "start": "node server.js"
  }
}

👉 You can generate summaries using IBM Bob

Step 4: Enhance with watsonx

Use watsonx to:

Refine summaries
Detect architecture
Improve structure understanding

👉 This becomes your knowledge base

⚙️ PHASE 3 — AI Generation Layer
🎯 Goal: Generate onboarding content
1. Project Summary

Prompt:

Based on this repo context:
[context JSON]

Explain the project in simple terms
2. Setup Guide
Generate step-by-step setup instructions using:
- scripts
- dependencies
- README
3. Architecture Explanation
Explain how different parts of the system connect
4. 🔥 Personalized Onboarding Plan
Create a 3-day onboarding plan:
Day 1: setup
Day 2: understanding modules
Day 3: contributing

👉 This is your differentiator

💬 PHASE 4 — Context-Aware Chatbot (WOW FEATURE)
🧠 How it works
❌ Basic (don’t do)

Send question → AI → answer

✅ Smart (your version)
User asks:
Where is authentication handled?
Backend:
Searches context JSON
Finds relevant files
Send to AI:
User question: Where is authentication handled?

Relevant context:
- src/auth.js → Handles JWT authentication

Answer based ONLY on this project
🔥 Result

Instead of generic:

Authentication is usually…

You get:

Authentication is handled in src/auth.js using JWT middleware.
🤖 PHASE 5 — watsonx Enhancement Layer
Where watsonx shines
✅ 1. Context refinement
Clean summaries
Better explanations
✅ 2. Smarter answers
More accurate than raw prompts
✅ 3. Reasoning
Multi-step answers
Better onboarding plans
⚡ Optional (if time allows)
Agent-like behavior

User asks:

How do I run this?

System:

Checks scripts
Reads README
Generates steps

👉 Looks like “thinking AI”

🎨 PHASE 6 — Frontend UI
Build 3 Screens ONLY
1. Input Screen
GitHub URL input
Button: Analyze Repo
2. Dashboard

Show:

Project Summary
Setup Guide
Architecture
Onboarding Plan
3. Chat Interface
Chat UI
Ask repo questions

👉 Keep UI clean, not fancy

🧪 PHASE 7 — Testing + Polish
Test:
Repo parsing
Context creation
AI outputs
Chat accuracy
Fix:
Slow responses
Bad answers
UI issues
Add:
Loading spinner
Error handling
🎬 PHASE 8 — Demo Video (CRITICAL)
Structure
⏱️ 0:00 – Problem

Developers waste hours understanding new repos…

⏱️ 0:20 – Demo
Paste repo
Show generated onboarding
Show architecture
Ask questions
⏱️ 1:30 – 🔥 Highlight THIS

We use watsonx to ground responses in actual repo context

⏱️ 2:15 – Wrap
Faster onboarding
Real usefulness
📝 PHASE 9 — Submission Content
1. Problem + Solution
Focus on onboarding pain
Explain AI solution
Highlight context-awareness
2. IBM Usage (IMPORTANT)

Explain:

Bob → generation + chat
watsonx → context reasoning
(Optional) Orchestrate → workflow logic
3. Code Repository

Include:

Clean code
README
Bob report
```
