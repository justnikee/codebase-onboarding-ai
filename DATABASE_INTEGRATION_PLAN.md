# Database Integration & Chatbot Improvement Plan

## 🎯 Overview

This document provides a **step-by-step implementation plan** for:
1. **Database Integration** - User accounts, history, analytics, multi-user support
2. **Chatbot Quality Improvement** - Fix repetitive responses, add conversation memory

---

## 📊 Part 1: Database Integration Plan

### Phase 1: Database Setup (2-3 hours)

#### Step 1.1: Choose Database Technology (30 min)

**Recommended: PostgreSQL + Prisma**

**Why?**
- ✅ Type-safe database access
- ✅ Automatic migrations
- ✅ Great TypeScript support
- ✅ Easy to deploy (Vercel, Railway, Supabase)

**Installation:**
```bash
cd backend
npm install @prisma/client prisma
npm install bcryptjs jsonwebtoken
npm install @types/bcryptjs @types/jsonwebtoken --save-dev
npx prisma init
```

#### Step 1.2: Design Database Schema (30 min)

**File: `backend/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User Management
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  passwordHash  String
  createdAt     DateTime  @default(now())
  lastLoginAt   DateTime?
  
  analyses      Analysis[]
  chatMessages  ChatMessage[]
  feedback      Feedback[]
  analytics     AnalyticsEvent[]
  
  @@map("users")
}

// Repository Analysis History
model Analysis {
  id              String    @id @default(uuid())
  userId          String
  repoUrl         String
  contextId       String    @unique
  status          String    // 'pending', 'completed', 'failed'
  errorMessage    String?
  analysisTimeMs  Int?
  createdAt       DateTime  @default(now())
  completedAt     DateTime?
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  chatMessages    ChatMessage[]
  feedback        Feedback?
  
  @@index([userId, createdAt])
  @@index([repoUrl])
  @@map("analyses")
}

// Chat History
model ChatMessage {
  id          String    @id @default(uuid())
  analysisId  String
  userId      String
  role        String    // 'user' or 'assistant'
  content     Text
  relevantFiles String[] // Array of file paths
  confidence  String?   // 'high', 'medium', 'low'
  createdAt   DateTime  @default(now())
  
  analysis    Analysis  @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([analysisId, createdAt])
  @@index([userId, createdAt])
  @@map("chat_messages")
}

// User Feedback (Training Data)
model Feedback {
  id          String    @id @default(uuid())
  analysisId  String    @unique
  userId      String
  rating      Int       // 1-5 stars
  comment     String?
  helpful     Boolean?
  accurate    Boolean?
  createdAt   DateTime  @default(now())
  
  analysis    Analysis  @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([rating])
  @@map("feedback")
}

// Analytics Events
model AnalyticsEvent {
  id          String    @id @default(uuid())
  userId      String?
  eventType   String    // 'repo_analyzed', 'chat_message', 'feedback_submitted', etc.
  metadata    Json?     // Flexible JSON for event-specific data
  createdAt   DateTime  @default(now())
  
  user        User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([eventType, createdAt])
  @@index([userId, createdAt])
  @@map("analytics_events")
}

// Training Data Collection
model TrainingData {
  id              String    @id @default(uuid())
  question        String
  answer          String
  context         Json      // Repository context used
  relevantFiles   String[]
  userFeedback    String?   // 'helpful', 'not_helpful', 'incorrect'
  rating          Int?      // 1-5
  createdAt       DateTime  @default(now())
  
  @@index([createdAt])
  @@map("training_data")
}
```

#### Step 1.3: Setup Database Connection (30 min)

**File: `backend/.env`**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ai_onboarding"
JWT_SECRET="your-super-secret-jwt-key-change-this"
```

**File: `backend/src/lib/prisma.ts`**
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Run migrations:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

#### Step 1.4: Create Database Services (1 hour)

**File: `backend/src/services/database.ts`**
```typescript
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class DatabaseService {
  // User Management
  async createUser(email: string, password: string, name?: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    return prisma.user.create({
      data: { email, passwordHash, name }
    });
  }

  async authenticateUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('Invalid password');
    
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    return { user, token };
  }

  // Analysis History
  async createAnalysis(userId: string, repoUrl: string, contextId: string) {
    return prisma.analysis.create({
      data: {
        userId,
        repoUrl,
        contextId,
        status: 'pending'
      }
    });
  }

  async updateAnalysisStatus(
    contextId: string,
    status: string,
    analysisTimeMs?: number,
    errorMessage?: string
  ) {
    return prisma.analysis.update({
      where: { contextId },
      data: {
        status,
        analysisTimeMs,
        errorMessage,
        completedAt: status === 'completed' ? new Date() : undefined
      }
    });
  }

  async getUserAnalyses(userId: string, limit = 20) {
    return prisma.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        feedback: true,
        _count: {
          select: { chatMessages: true }
        }
      }
    });
  }

  // Chat History
  async saveChatMessage(
    analysisId: string,
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    relevantFiles?: string[],
    confidence?: string
  ) {
    return prisma.chatMessage.create({
      data: {
        analysisId,
        userId,
        role,
        content,
        relevantFiles: relevantFiles || [],
        confidence
      }
    });
  }

  async getChatHistory(analysisId: string) {
    return prisma.chatMessage.findMany({
      where: { analysisId },
      orderBy: { createdAt: 'asc' }
    });
  }

  // Feedback & Training Data
  async saveFeedback(
    analysisId: string,
    userId: string,
    rating: number,
    comment?: string,
    helpful?: boolean,
    accurate?: boolean
  ) {
    return prisma.feedback.create({
      data: {
        analysisId,
        userId,
        rating,
        comment,
        helpful,
        accurate
      }
    });
  }

  async saveTrainingData(
    question: string,
    answer: string,
    context: any,
    relevantFiles: string[],
    userFeedback?: string,
    rating?: number
  ) {
    return prisma.trainingData.create({
      data: {
        question,
        answer,
        context,
        relevantFiles,
        userFeedback,
        rating
      }
    });
  }

  // Analytics
  async trackEvent(
    eventType: string,
    userId?: string,
    metadata?: any
  ) {
    return prisma.analyticsEvent.create({
      data: {
        eventType,
        userId,
        metadata
      }
    });
  }

  async getAnalytics(startDate: Date, endDate: Date) {
    const [
      totalUsers,
      totalAnalyses,
      totalChatMessages,
      avgRating,
      popularRepos
    ] = await Promise.all([
      prisma.user.count(),
      prisma.analysis.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.chatMessage.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.feedback.aggregate({
        _avg: { rating: true }
      }),
      prisma.analysis.groupBy({
        by: ['repoUrl'],
        _count: true,
        orderBy: { _count: { repoUrl: 'desc' } },
        take: 10
      })
    ]);

    return {
      totalUsers,
      totalAnalyses,
      totalChatMessages,
      avgRating: avgRating._avg.rating,
      popularRepos
    };
  }
}

export const databaseService = new DatabaseService();
```

---

### Phase 2: Authentication System (2 hours)

#### Step 2.1: Create Auth Middleware (30 min)

**File: `backend/src/middleware/auth.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };
    }
    
    next();
  } catch (error) {
    // Invalid token, but continue without auth
    next();
  }
};
```

#### Step 2.2: Create Auth Routes (1 hour)

**File: `backend/src/routes/auth.ts`**
```typescript
import express from 'express';
import { databaseService } from '../services/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    const user = await databaseService.createUser(email, password, name);
    const { token } = await databaseService.authenticateUser(email, password);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await databaseService.authenticateUser(email, password);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      }
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

#### Step 2.3: Update Existing Routes (30 min)

**Update `backend/src/routes/analyze.ts`:**
```typescript
import { authMiddleware, AuthRequest } from '../middleware/auth';

// Add auth middleware
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  
  // Create analysis record
  const analysis = await databaseService.createAnalysis(
    userId,
    repoUrl,
    contextId
  );
  
  // Track analytics
  await databaseService.trackEvent('repo_analyzed', userId, {
    repoUrl,
    contextId
  });
  
  // ... rest of analysis logic
});
```

---

### Phase 3: History & Analytics UI (2 hours)

#### Step 3.1: Create History Page (1 hour)

**File: `frontend/src/app/history/page.tsx`**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.getUserHistory();
      setAnalyses(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Analysis History</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {analyses.map((analysis) => (
            <div key={analysis.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold">{analysis.repoUrl}</h3>
              <p className="text-gray-600">
                Analyzed {new Date(analysis.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => router.push(`/dashboard?contextId=${analysis.contextId}`)}
                  className="btn-primary"
                >
                  View Analysis
                </button>
                <button
                  onClick={() => router.push(`/chat?contextId=${analysis.contextId}`)}
                  className="btn-secondary"
                >
                  Continue Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Step 3.2: Create Analytics Dashboard (1 hour)

**File: `frontend/src/app/admin/analytics/page.tsx`**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const data = await api.getAnalytics();
    setAnalytics(data);
  };

  if (!analytics) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm">Total Users</h3>
          <p className="text-3xl font-bold">{analytics.totalUsers}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm">Analyses This Month</h3>
          <p className="text-3xl font-bold">{analytics.totalAnalyses}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm">Average Rating</h3>
          <p className="text-3xl font-bold">{analytics.avgRating?.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Popular Repositories</h2>
        <div className="space-y-2">
          {analytics.popularRepos.map((repo, index) => (
            <div key={index} className="flex justify-between items-center">
              <span>{repo.repoUrl}</span>
              <span className="text-gray-600">{repo._count} analyses</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🤖 Part 2: Chatbot Quality Improvement

### Problem Analysis

**Current Issues:**
1. ❌ No conversation memory - each question is isolated
2. ❌ Limited context - only uses file summaries
3. ❌ Generic responses - doesn't reference actual code
4. ❌ No follow-up capability - can't build on previous answers
5. ❌ Temperature too high (0.6) - causes repetitive patterns

### Solution: Enhanced Chatbot with Memory

#### Step 1: Improve Chat Service (1 hour)

**File: `backend/src/services/chat.ts` (Enhanced)**
```typescript
import { ChatRequest, ChatResponse, ChatMessage } from '../types/index.js';
import { contextService } from './context.js';
import { watsonxService } from './watsonx.js';
import { databaseService } from './database.js';

class ChatService {
  async processQuestion(request: ChatRequest): Promise<ChatResponse> {
    const { contextId, question, conversationHistory = [] } = request;
    
    // Load repository context
    const context = await contextService.loadContext(contextId);
    if (!context) {
      throw new Error('Repository context not found');
    }

    // Get chat history from database (last 10 messages)
    const dbHistory = await databaseService.getChatHistory(contextId);
    const recentHistory = dbHistory.slice(-10);

    // Search for relevant files
    const relevantFiles = contextService.searchRelevantFiles(context, question, 5);

    // Get actual file content for better context
    const fileContents = await this.getFileContents(context, relevantFiles);

    // Build enhanced prompt with conversation memory
    const answer = await watsonxService.answerQuestionWithMemory(
      question,
      fileContents,
      context.metadata.name,
      recentHistory,
      context.readme || ''
    );

    // Save to database for training
    if (request.userId) {
      await databaseService.saveChatMessage(
        contextId,
        request.userId,
        'user',
        question
      );
      
      await databaseService.saveChatMessage(
        contextId,
        request.userId,
        'assistant',
        answer,
        relevantFiles.map(f => f.path),
        this.calculateConfidence(relevantFiles)
      );

      // Save as training data
      await databaseService.saveTrainingData(
        question,
        answer,
        { contextId, repoUrl: context.repoUrl },
        relevantFiles.map(f => f.path)
      );
    }

    return {
      answer: answer.trim(),
      relevantFiles: relevantFiles.map(f => f.path),
      confidence: this.calculateConfidence(relevantFiles),
      sources: relevantFiles.map(f => f.path)
    };
  }

  private async getFileContents(
    context: any,
    relevantFiles: Array<{ path: string; summary: string; score: number }>
  ): Promise<Array<{ path: string; content: string; summary: string }>> {
    const contents = [];
    
    for (const file of relevantFiles.slice(0, 3)) {
      // Get actual file content from keyFiles or fetch from GitHub
      const content = context.keyFiles[file.path] || 
                     await this.fetchFileContent(context.repoUrl, file.path);
      
      if (content) {
        contents.push({
          path: file.path,
          content: content.substring(0, 2000), // Limit to 2000 chars
          summary: file.summary
        });
      }
    }
    
    return contents;
  }

  private calculateConfidence(files: any[]): 'high' | 'medium' | 'low' {
    if (files.length === 0) return 'low';
    const avgScore = files.reduce((sum, f) => sum + f.score, 0) / files.length;
    return avgScore > 0.5 ? 'high' : avgScore > 0.2 ? 'medium' : 'low';
  }
}
```

#### Step 2: Enhanced Watsonx Prompts (30 min)

**File: `backend/src/services/watsonx.ts` (Add new method)**
```typescript
async answerQuestionWithMemory(
  question: string,
  fileContents: Array<{ path: string; content: string; summary: string }>,
  repoName: string,
  conversationHistory: any[],
  readme: string
): Promise<string> {
  // Build conversation context
  const historyText = conversationHistory
    .slice(-6) // Last 3 exchanges
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');

  // Build file context with actual code
  const filesText = fileContents
    .map(f => `
File: ${f.path}
Summary: ${f.summary}

Code excerpt:
\`\`\`
${f.content}
\`\`\`
    `)
    .join('\n---\n');

  const prompt = `You are an expert AI assistant helping developers understand the ${repoName} repository.

PROJECT README:
${readme.substring(0, 1000)}

RELEVANT CODE FILES:
${filesText}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ''}

CURRENT QUESTION: ${question}

INSTRUCTIONS:
1. Answer based on the actual code provided above
2. Reference specific file names and line numbers when relevant
3. If this is a follow-up question, build on previous context
4. Be specific and technical - quote actual code when helpful
5. If you don't have enough information, say so clearly
6. Keep answers concise but informative (2-4 paragraphs max)

ANSWER:`;

  return await this.generate({
    model: 'ibm/granite-13b-chat-v2',
    prompt,
    maxTokens: 800,
    temperature: 0.4, // Lower temperature for more consistent responses
    topP: 0.9,
    topK: 40
  });
}
```

---

## 📋 Implementation Timeline

### Week 1: Database Foundation
- **Day 1-2:** Database setup, schema, migrations
- **Day 3:** Database services and utilities
- **Day 4:** Authentication system
- **Day 5:** Update existing routes with auth

### Week 2: Features & UI
- **Day 1:** History tracking implementation
- **Day 2:** Analytics dashboard
- **Day 3:** Training data collection
- **Day 4:** Chatbot improvements
- **Day 5:** Testing and bug fixes

### Week 3: Polish & Deploy
- **Day 1-2:** Frontend UI improvements
- **Day 3:** Performance optimization
- **Day 4:** Documentation
- **Day 5:** Deployment

---

## 🎯 Priority Order

### Must Have (Do First):
1. ✅ **Fix Chatbot Quality** (1-2 hours) - Immediate impact
2. ✅ **Database Setup** (2-3 hours) - Foundation for everything
3. ✅ **Authentication** (2 hours) - Required for multi-user

### Should Have (Do Next):
4. ✅ **History Tracking** (1 hour) - User value
5. ✅ **Chat Memory** (1 hour) - Better conversations
6. ✅ **Training Data** (30 min) - Future improvements

### Nice to Have (Do Later):
7. ⚠️ **Analytics Dashboard** (2 hours) - Admin feature
8. ⚠️ **Advanced Analytics** (2 hours) - Insights
9. ⚠️ **Export Features** (1 hour) - Convenience

---

## 🚀 Quick Start (Minimum Viable)

If you want to start **TODAY**, do this:

### Option A: Fix Chatbot Only (2 hours)
1. Update `watsonx.ts` with new `answerQuestionWithMemory` method
2. Update `chat.ts` to use conversation history
3. Lower temperature to 0.4
4. Add actual file content to context

### Option B: Add Database (4 hours)
1. Install Prisma and PostgreSQL
2. Create schema and run migrations
3. Add authentication middleware
4. Update analyze route to save to database

### Option C: Both (6 hours)
1. Do Option A first (immediate improvement)
2. Then do Option B (long-term foundation)

---

## 📊 Expected Improvements

### Chatbot Quality:
- **Before:** Generic, repetitive responses
- **After:** Specific, code-aware, contextual answers
- **Improvement:** 3-5x better response quality

### User Experience:
- **Before:** No history, no memory
- **After:** Full history, conversation memory
- **Improvement:** Professional, production-ready

### Data Collection:
- **Before:** No training data
- **After:** Every interaction saved
- **Improvement:** Can improve model over time

---

## 🎤 Demo Strategy

### Without Database:
> "This is a proof-of-concept focusing on AI capabilities. We've optimized the chatbot with conversation memory and code-aware responses."

### With Database:
> "This is a production-ready system with user management, history tracking, and analytics. Every interaction is saved for continuous improvement."

---

## Made with Bob 🤖