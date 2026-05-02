# Testing Checklist

## 🚀 Quick Start Testing

Now that you've configured the real IBM watsonx API key, follow these steps to test your application:

### 1. Start the Backend Server

```bash
cd backend
npm install  # If not already done
npm run dev
```

**Expected Output:**
```
==================================================
🚀 AI Developer Onboarding Assistant
==================================================
Server running on port 5000
Environment: development
Mock Mode: false (Using real IBM watsonx)
==================================================
```

### 2. Start the Frontend

In a new terminal:

```bash
cd frontend
npm install  # If not already done
npm run dev
```

**Expected Output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 3. Test Basic Flow

#### Step 1: Analyze a Repository
1. Open http://localhost:3000
2. Enter a GitHub repository URL (try: `https://github.com/vercel/next.js`)
3. Click "Analyze Repository"
4. Wait for analysis to complete (30-60 seconds)

**What to Check:**
- ✅ Loading spinner appears
- ✅ No errors in browser console
- ✅ Redirects to dashboard after completion
- ✅ Backend logs show API calls to IBM watsonx

#### Step 2: View Dashboard
After analysis completes:

**What to Check:**
- ✅ Project summary is displayed
- ✅ Tech stack is detected correctly
- ✅ Setup steps are shown
- ✅ Architecture explanation is present
- ✅ File structure is visible

#### Step 3: Test Chat
1. Click "Chat with AI" button
2. Try these questions:
   - "What is this project about?"
   - "How do I set up the development environment?"
   - "What technologies are used?"
   - "Where is the main entry point?"

**What to Check:**
- ✅ AI responds with relevant answers
- ✅ Relevant files are shown
- ✅ Responses are context-aware (mention actual files)
- ✅ No generic responses

### 4. Test Advanced Features

#### Test Code Metrics
```bash
# Get the contextId from the dashboard URL or backend logs
curl http://localhost:5000/api/insights/{contextId}/code-metrics
```

**What to Check:**
- ✅ Returns metrics object
- ✅ Shows complexity, maintainability, test coverage
- ✅ Lists dependencies
- ✅ Detects architecture patterns
- ✅ Identifies code smells

#### Test Visualizations
```bash
curl http://localhost:5000/api/insights/{contextId}/visualizations?type=dependency-graph
curl http://localhost:5000/api/insights/{contextId}/visualizations?type=heatmap
curl http://localhost:5000/api/insights/{contextId}/visualizations?type=architecture
```

**What to Check:**
- ✅ Returns visualization data
- ✅ Includes nodes, edges, clusters
- ✅ Has meaningful structure

#### Test Recommendations
```bash
curl http://localhost:5000/api/insights/{contextId}/recommendations
```

**What to Check:**
- ✅ Returns array of recommendations
- ✅ Each has priority, impact, action items
- ✅ Includes resources and effort estimates

#### Test Learning Path
```bash
curl -X POST http://localhost:5000/api/insights/{contextId}/learning-path \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "experienceLevel": "intermediate",
      "knownTechnologies": ["JavaScript"],
      "learningGoals": ["Learn the codebase"],
      "timeCommitment": "regular"
    }
  }'
```

**What to Check:**
- ✅ Returns learning path with modules
- ✅ Includes milestones and assessments
- ✅ Has personalized content

### 5. Test Error Handling

#### Test Invalid Repository
1. Enter invalid URL: `https://github.com/invalid/repo-that-does-not-exist`
2. Click "Analyze Repository"

**What to Check:**
- ✅ Shows error message
- ✅ Doesn't crash the app
- ✅ Allows retry

#### Test Invalid Context ID
```bash
curl http://localhost:5000/api/insights/invalid-context-id/code-metrics
```

**What to Check:**
- ✅ Returns 404 error
- ✅ Error message is clear

### 6. Check Backend Logs

Look for these in the backend terminal:

**Good Signs:**
```
✅ Building context for https://github.com/...
✅ Fetching repository metadata...
✅ Fetching README...
✅ Analyzing file structure...
✅ Generating project summary...
✅ Context built successfully: {contextId}
```

**Warning Signs:**
```
❌ Failed to fetch repository
❌ IBM watsonx API error
❌ Authentication failed
```

### 7. Test Multiple Repositories

Try analyzing these different types of repositories:

1. **Small Project**: `https://github.com/sindresorhus/is`
2. **Medium Project**: `https://github.com/expressjs/express`
3. **Large Project**: `https://github.com/facebook/react`
4. **Python Project**: `https://github.com/pallets/flask`
5. **Your Own Project**: Any public GitHub repo

**What to Check:**
- ✅ All complete successfully
- ✅ Tech stack is detected correctly for each
- ✅ Chat works for all repositories
- ✅ Advanced features work for all

## 🐛 Common Issues & Solutions

### Issue 1: "IBM watsonx API error"
**Solution:**
1. Check your API key is correct in `backend/.env`
2. Verify `USE_MOCK_WATSONX=false`
3. Ensure your IBM Cloud account is active
4. Check you have access to watsonx.ai

### Issue 2: "Rate limit exceeded"
**Solution:**
1. Add GitHub token to `backend/.env`:
   ```
   GITHUB_TOKEN=your_github_personal_access_token
   ```
2. Wait a few minutes before retrying

### Issue 3: Frontend can't connect to backend
**Solution:**
1. Verify backend is running on port 5000
2. Check CORS settings in `backend/src/server.ts`
3. Ensure `FRONTEND_URL=http://localhost:3000` in backend/.env

### Issue 4: Context not found
**Solution:**
1. Check `backend/src/storage/contexts/` directory exists
2. Verify context was saved successfully
3. Use correct contextId from analysis response

## 📊 Performance Benchmarks

Expected performance for a medium-sized repository (~100 files):

- **Analysis Time**: 30-60 seconds
- **Chat Response**: 2-5 seconds
- **Code Metrics**: 1-3 seconds
- **Visualizations**: 1-2 seconds
- **Recommendations**: 2-4 seconds
- **Learning Path**: 3-5 seconds

## ✅ Success Criteria

Your application is working correctly if:

1. ✅ Can analyze at least 3 different repositories
2. ✅ Chat provides context-aware answers
3. ✅ Dashboard shows all information correctly
4. ✅ Advanced features return meaningful data
5. ✅ No crashes or unhandled errors
6. ✅ IBM watsonx API calls succeed
7. ✅ Loading states work properly
8. ✅ Error messages are user-friendly

## 🎯 Next Steps

After successful testing:

1. **Polish UI**: Add loading spinners, improve styling
2. **Add Visualizations to Frontend**: Create React components for graphs
3. **Enhance Error Handling**: Better error messages and recovery
4. **Add More Features**: Implement additional insights
5. **Create Demo Video**: Record walkthrough of features
6. **Prepare Submission**: Write final documentation

## 📝 Testing Log Template

Use this to track your testing:

```
Date: ___________
Tester: ___________

Repository Tested: ___________
✅/❌ Analysis completed
✅/❌ Dashboard loaded
✅/❌ Chat worked
✅/❌ Code metrics returned
✅/❌ Visualizations generated
✅/❌ Recommendations provided
✅/❌ Learning path created

Issues Found:
1. ___________
2. ___________

Notes:
___________
```

## 🚀 Ready to Test!

You're all set! Start with Step 1 and work through the checklist. Good luck! 🎉