# ⚡ Quick Start Guide

Get the AI Developer Onboarding Assistant running in 5 minutes!

## 🚀 Fastest Way to Start (No IBM Credentials Needed)

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

### Step 2: Configure Environment

**Backend Setup:**
```bash
cd backend
cp .env.example .env
```

**Edit `backend/.env` and set:**
```env
PORT=5000
NODE_ENV=development
USE_MOCK_WATSONX=true
FRONTEND_URL=http://localhost:3000
```

**Frontend Setup:**
```bash
cd frontend
cp .env.local.example .env.local
```

The default settings in `.env.local` should work as-is.

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
==================================================
🚀 AI Developer Onboarding Assistant
==================================================
Server running on port 5000
⚠️  Running in MOCK mode - IBM watsonx credentials not required
==================================================
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
- Local:        http://localhost:3000
```

### Step 4: Test the Application

1. Open your browser to **http://localhost:3000**
2. Enter a GitHub repository URL (e.g., `https://github.com/vercel/next.js`)
3. Click "Analyze Repository"
4. View the generated analysis
5. Click "Ask Questions" to chat with the AI

**Note:** In mock mode, you'll get simulated AI responses. This is perfect for testing!

---

## 🔧 Fix for IBM Authentication Error

If you saw this error:
```
WatsonXError: Failed to authenticate with IBM Cloud: Request failed with status code 400
```

**Solution:** Add this line to your `backend/.env`:
```env
USE_MOCK_WATSONX=true
```

Then restart the backend server. The app will now use mock AI responses instead of real IBM watsonx API calls.

---

## 🎯 Using Real IBM watsonx (Optional)

When you're ready to use real AI:

1. **Get IBM Credentials** (see `ENV_SETUP_GUIDE.md` for detailed steps)
   - IBM watsonx API Key
   - Project ID
   - Region URL

2. **Update `backend/.env`:**
   ```env
   USE_MOCK_WATSONX=false
   IBM_WATSONX_API_KEY=your_real_api_key
   IBM_WATSONX_PROJECT_ID=your_real_project_id
   IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com
   ```

3. **Restart backend server**

---

## 📊 What You Can Do

### ✅ Analyze Repositories
- Paste any public GitHub repo URL
- Get instant project summary
- See tech stack analysis
- View setup instructions
- Understand architecture

### ✅ Ask Questions
- "How do I set up this project?"
- "Where is authentication handled?"
- "What API endpoints are available?"
- "How do I run the tests?"

### ✅ Get Context-Aware Answers
- Answers are based on actual repo files
- See which files are relevant
- Get confidence scores
- View suggested questions

---

## 🔍 Verify Everything Works

### Check Backend Health
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "uptime": 123
}
```

### Check Frontend
Open http://localhost:3000 in your browser

### Test Analysis
1. Enter: `https://github.com/facebook/react`
2. Click "Analyze Repository"
3. Wait for analysis (30-60 seconds)
4. View results

---

## 🐛 Common Issues

### Port Already in Use

**Backend (port 5000):**
```bash
# Change in backend/.env
PORT=5001
```

**Frontend (port 3000):**
```bash
npm run dev -- -p 3001
```

### "Cannot find module" Errors

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json .next
npm install
```

### CORS Errors

Make sure `backend/.env` has:
```env
FRONTEND_URL=http://localhost:3000
```

And restart the backend.

---

## 📁 Project Structure

```
ai-onboarding-assistant/
├── backend/              # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── utils/       # Helpers
│   │   └── server.ts    # Main server
│   └── .env             # Backend config
│
├── frontend/            # Next.js + TypeScript + Tailwind
│   ├── src/
│   │   └── app/        # Pages
│   └── .env.local      # Frontend config
│
└── docs/               # Documentation
```

---

## 🎓 Next Steps

1. **Explore the UI**
   - Try different repositories
   - Ask various questions
   - Check the dashboard features

2. **Read the Documentation**
   - `README.md` - Project overview
   - `ENV_SETUP_GUIDE.md` - Get IBM credentials
   - `TROUBLESHOOTING.md` - Fix common issues

3. **Customize**
   - Modify prompts in `backend/src/services/watsonx.ts`
   - Update UI in `frontend/src/app/`
   - Add new features

4. **Deploy**
   - Set up production environment
   - Use real IBM watsonx credentials
   - Deploy to cloud platform

---

## 💡 Pro Tips

- **Start with mock mode** to test without credentials
- **Use GitHub token** to avoid rate limits (5000 vs 60 requests/hour)
- **Check logs** in terminal for debugging
- **Read error messages** - they usually tell you what's wrong
- **Test with small repos first** - faster analysis

---

## 📞 Need Help?

- **Troubleshooting:** See `TROUBLESHOOTING.md`
- **Environment Setup:** See `ENV_SETUP_GUIDE.md`
- **Quick Reference:** See `ENV_QUICK_REFERENCE.md`

---

## ✨ Features Checklist

- [x] GitHub repository analysis
- [x] AI-powered summaries
- [x] Setup instructions generation
- [x] Architecture explanations
- [x] Tech stack detection
- [x] Context-aware chatbot
- [x] Relevant file detection
- [x] Confidence scoring
- [x] Mock mode for testing
- [x] Beautiful UI with Tailwind CSS

---

**🎉 You're ready to go! Start analyzing repositories and asking questions!**