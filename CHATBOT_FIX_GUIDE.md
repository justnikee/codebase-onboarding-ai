# Quick Chatbot Quality Fix Guide

## 🎯 Problem

The chatbot gives **repetitive, generic responses** because:
1. ❌ No conversation memory - treats each question independently
2. ❌ Only uses file summaries - not actual code
3. ❌ Temperature too high (0.6) - causes repetitive patterns
4. ❌ Limited context - doesn't see full picture

## ✅ Solution (2 Hours Implementation)

### Step 1: Enhance Watsonx Service (30 min)

**File: `backend/src/services/watsonx.ts`**

Add this new method after the existing `answerQuestion` method:

```typescript
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
    temperature: 0.4,  // LOWER = more consistent
    topP: 0.9,
    topK: 40
  });
}
```

### Step 2: Update Chat Service (1 hour)

**File: `backend/src/services/chat.ts`**

Replace the `processQuestion` method:

```typescript
async processQuestion(request: ChatRequest): Promise<ChatResponse> {
  const { contextId, question, conversationHistory = [] } = request;
  
  // Load repository context
  const context = await contextService.loadContext(contextId);
  if (!context) {
    throw new Error('Repository context not found');
  }

  // Search for relevant files
  const relevantFiles = contextService.searchRelevantFiles(context, question, 5);

  if (relevantFiles.length === 0) {
    return {
      answer: `I don't have specific information about that in the ${context.metadata.name} repository. ` +
              `Try asking about: ${context.files.slice(0, 3).map(f => f.path).join(', ')}`,
      relevantFiles: [],
      confidence: 'low',
      sources: []
    };
  }

  // Get actual file contents (not just summaries!)
  const fileContents = await this.getFileContents(context, relevantFiles);

  // Generate answer with memory and actual code
  const answer = await watsonxService.answerQuestionWithMemory(
    question,
    fileContents,
    context.metadata.name,
    conversationHistory,
    context.readme || ''
  );

  const avgScore = relevantFiles.reduce((sum, f) => sum + f.score, 0) / relevantFiles.length;
  const confidence = avgScore > 0.5 ? 'high' : avgScore > 0.2 ? 'medium' : 'low';

  return {
    answer: answer.trim(),
    relevantFiles: relevantFiles.map(f => f.path),
    confidence,
    sources: relevantFiles.map(f => f.path)
  };
}

/**
 * Get actual file contents (not just summaries)
 */
private async getFileContents(
  context: any,
  relevantFiles: Array<{ path: string; summary: string; score: number }>
): Promise<Array<{ path: string; content: string; summary: string }>> {
  const contents = [];
  
  // Get top 3 most relevant files
  for (const file of relevantFiles.slice(0, 3)) {
    try {
      // Try to get from keyFiles first (already loaded)
      let content = context.keyFiles[file.path];
      
      // If not in keyFiles, try to fetch from GitHub
      if (!content && context.repoUrl.includes('github.com')) {
        content = await githubService.getFileContent(context.repoUrl, file.path);
      }
      
      if (content) {
        contents.push({
          path: file.path,
          content: content.substring(0, 2000), // Limit to 2000 chars
          summary: file.summary
        });
      }
    } catch (error) {
      console.warn(`Failed to get content for ${file.path}:`, error);
      // Still include the summary
      contents.push({
        path: file.path,
        content: `[Content not available]\n\nSummary: ${file.summary}`,
        summary: file.summary
      });
    }
  }
  
  return contents;
}
```

Add the import at the top:
```typescript
import { githubService } from './github.js';
```

### Step 3: Update Frontend to Send History (30 min)

**File: `frontend/src/app/chat/page.tsx`**

Update the chat component to send conversation history:

```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);

const handleSendMessage = async () => {
  if (!input.trim() || isLoading) return;

  const userMessage: ChatMessage = {
    role: 'user',
    content: input,
    timestamp: new Date().toISOString()
  };

  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsLoading(true);

  try {
    // Send conversation history with the request
    const response = await api.chat(contextId, input, messages);
    
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response.answer,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, assistantMessage]);
  } catch (error) {
    console.error('Chat error:', error);
  } finally {
    setIsLoading(false);
  }
};
```

**File: `frontend/src/services/api.ts`**

Update the chat method:

```typescript
async chat(
  contextId: string,
  question: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  const response = await fetch(`${this.baseUrl}/chat`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify({
      contextId,
      question,
      conversationHistory: conversationHistory.slice(-10) // Last 10 messages
    })
  });

  if (!response.ok) {
    throw new Error('Chat request failed');
  }

  const data = await response.json();
  return data.data;
}
```

---

## 🎯 Expected Improvements

### Before:
```
User: "How does authentication work?"
Bot: "This project uses authentication. It's implemented in the codebase."

User: "Can you show me the code?"
Bot: "This project uses authentication. It's implemented in the codebase."
```

### After:
```
User: "How does authentication work?"
Bot: "Authentication is handled in `src/middleware/auth.ts` using JWT tokens. 

The middleware checks for a Bearer token in the Authorization header:
```typescript
const token = req.headers.authorization?.replace('Bearer ', '');
const decoded = jwt.verify(token, process.env.JWT_SECRET!);
```

The token is verified using the JWT_SECRET environment variable and contains the user's ID and email."

User: "Can you show me the code?"
Bot: "Based on our previous discussion about authentication, here's the complete middleware implementation from `src/middleware/auth.ts`:

[Shows actual code with line numbers and explanations]

This middleware is used in routes like `/api/analyze` to protect endpoints that require authentication."
```

---

## 🚀 Testing the Fix

### Test 1: Basic Question
```
Question: "What does this project do?"
Expected: Specific answer referencing README and key files
```

### Test 2: Follow-up Question
```
Question 1: "How do I set up the project?"
Question 2: "What about the database?"
Expected: Second answer builds on first, references setup steps
```

### Test 3: Code-Specific Question
```
Question: "Show me the authentication code"
Expected: Actual code snippets with file paths
```

### Test 4: Conversation Memory
```
Question 1: "What's in the API routes?"
Question 2: "How do they handle errors?"
Expected: Second answer references the routes from first question
```

---

## 📊 Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Context** | File summaries only | Actual code + summaries |
| **Memory** | None | Last 6 messages |
| **Temperature** | 0.6 (high) | 0.4 (lower) |
| **Prompt** | Generic | Code-aware, specific |
| **Response Quality** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🐛 Troubleshooting

### Issue: Still getting generic responses
**Solution:** Check that `fileContents` actually has code, not just summaries

### Issue: Responses too long
**Solution:** Reduce `maxTokens` from 800 to 500

### Issue: Not using conversation history
**Solution:** Verify `conversationHistory` is being passed from frontend

### Issue: Can't fetch file contents
**Solution:** Ensure GitHub token is set if repo is private

---

## ⏱️ Implementation Time

- **Step 1:** 30 minutes (Add new watsonx method)
- **Step 2:** 1 hour (Update chat service)
- **Step 3:** 30 minutes (Update frontend)
- **Total:** 2 hours

---

## 🎯 Next Steps After This Fix

1. ✅ Test with real repositories
2. ✅ Collect user feedback
3. ✅ Add database for persistent history (see DATABASE_INTEGRATION_PLAN.md)
4. ✅ Implement training data collection
5. ✅ Add feedback buttons (helpful/not helpful)

---

## Made with Bob 🤖