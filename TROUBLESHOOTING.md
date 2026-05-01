# 🔧 Troubleshooting Guide

## Quick Fix: IBM watsonx Authentication Error

If you're seeing this error:
```
WatsonXError: Failed to authenticate with IBM Cloud: Request failed with status code 400
```

### Solution 1: Use Mock Service (Fastest - For Testing)

1. **Edit `backend/.env`:**
   ```env
   USE_MOCK_WATSONX=true
   ```

2. **Restart the backend server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

3. **You should see:**
   ```
   ⚠️  Running in MOCK mode - IBM watsonx credentials not required
   ⚠️  Using MOCK watsonx service - Set IBM_WATSONX_API_KEY to use real API
   ```

The app will now work with simulated AI responses!

### Solution 2: Fix IBM Credentials (For Production)

The API key format in your `.env` suggests it might be incorrect. IBM Cloud API keys typically start with different prefixes.

**Steps to get correct credentials:**

1. **Go to IBM Cloud Console:**
   - Visit: https://cloud.ibm.com/
   - Log in to your account

2. **Create/Get API Key:**
   - Click your profile (top right) → **Manage** → **Access (IAM)**
   - Click **API keys** in left sidebar
   - Click **Create** button
   - Name it (e.g., "watsonx-dev")
   - **Copy the key immediately** (starts with letters/numbers, not `xf_`)

3. **Get Project ID:**
   - Go to watsonx.ai: https://dataplatform.cloud.ibm.com/wx/home
   - Open your project
   - Click **Manage** tab
   - Copy the **Project ID** (UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)

4. **Update `backend/.env`:**
   ```env
   USE_MOCK_WATSONX=false
   IBM_WATSONX_API_KEY=your_new_api_key_here
   IBM_WATSONX_PROJECT_ID=your_project_id_here
   IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com
   ```

5. **Restart server**

---

## Common Errors & Solutions

### Error: "Missing required environment variables"

**Cause:** `.env` file not configured

**Solution:**
```bash
cd backend
cp .env.example .env
# Edit .env with your values OR set USE_MOCK_WATSONX=true
```

---

### Error: "ENOENT: no such file or directory"

**Cause:** Running from wrong directory

**Solution:**
```bash
# Make sure you're in the backend directory
cd backend
npm run dev
```

---

### Error: "Port 5000 already in use"

**Cause:** Another app is using port 5000

**Solution:**
```bash
# Option 1: Change port in backend/.env
PORT=5001

# Option 2: Kill the process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

---

### Error: "Cannot find module"

**Cause:** Dependencies not installed

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

### Error: "GitHub API rate limit exceeded"

**Cause:** Too many requests without authentication

**Solution:**
1. Create GitHub Personal Access Token: https://github.com/settings/tokens
2. Add to `backend/.env`:
   ```env
   GITHUB_TOKEN=ghp_your_token_here
   ```
3. Restart server

---

### Error: "CORS policy blocked"

**Cause:** Frontend URL mismatch

**Solution:**
1. Check `backend/.env`:
   ```env
   FRONTEND_URL=http://localhost:3000
   ```
2. Ensure frontend is running on port 3000
3. Restart backend server

---

### Frontend: "Failed to fetch"

**Cause:** Backend not running or wrong URL

**Solution:**
1. Check backend is running: http://localhost:5000/health
2. Check `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   ```
3. Restart frontend

---

## Development Mode Setup (No IBM Credentials Needed)

Perfect for testing and development:

1. **Backend `.env`:**
   ```env
   PORT=5000
   NODE_ENV=development
   USE_MOCK_WATSONX=true
   FRONTEND_URL=http://localhost:3000
   ```

2. **Start servers:**
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   cd frontend && npm run dev
   ```

3. **Test:**
   - Open http://localhost:3000
   - Enter any GitHub repo URL
   - Get mock AI responses

---

## Production Setup (Real IBM Credentials)

1. **Get IBM credentials** (see ENV_SETUP_GUIDE.md)

2. **Backend `.env`:**
   ```env
   PORT=5000
   NODE_ENV=production
   USE_MOCK_WATSONX=false
   IBM_WATSONX_API_KEY=your_real_key
   IBM_WATSONX_PROJECT_ID=your_real_project_id
   IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com
   GITHUB_TOKEN=your_github_token
   FRONTEND_URL=https://your-frontend-url.com
   ```

3. **Build and deploy**

---

## Checking Your Setup

### 1. Check Backend Health
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": 123
}
```

### 2. Check Environment Variables
```bash
cd backend
node -e "require('dotenv').config(); console.log(process.env.USE_MOCK_WATSONX)"
```

### 3. Check Ports
```bash
# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :5000
lsof -i :3000
```

---

## Still Having Issues?

1. **Check logs:**
   - Backend logs show in the terminal where you ran `npm run dev`
   - Look for error messages and stack traces

2. **Verify Node.js version:**
   ```bash
   node --version  # Should be 18.x or higher
   ```

3. **Clear and reinstall:**
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

4. **Check file permissions:**
   ```bash
   # Make sure you can write to storage directory
   ls -la backend/src/storage/contexts/
   ```

---

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Backend `.env` file created and configured
- [ ] Frontend `.env.local` file created
- [ ] Either `USE_MOCK_WATSONX=true` OR valid IBM credentials set
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000 in browser

---

## Contact & Resources

- **Full Setup Guide:** `ENV_SETUP_GUIDE.md`
- **Quick Reference:** `ENV_QUICK_REFERENCE.md`
- **Project README:** `README.md`
- **IBM watsonx Docs:** https://www.ibm.com/docs/en/watsonx-as-a-service
- **GitHub API Docs:** https://docs.github.com/en/rest

---

**💡 Pro Tip:** Start with `USE_MOCK_WATSONX=true` to test the app, then switch to real credentials when ready!