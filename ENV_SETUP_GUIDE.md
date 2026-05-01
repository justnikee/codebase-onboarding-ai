# 🔐 Environment Variables Setup Guide

This guide will walk you through obtaining all the required credentials and API keys for the AI Developer Onboarding Assistant.

---

## 📋 Required Environment Variables

### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# IBM watsonx Configuration
IBM_WATSONX_API_KEY=your_watsonx_api_key_here
IBM_WATSONX_PROJECT_ID=your_project_id_here
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com

# IBM Bob Configuration (if separate)
IBM_BOB_API_KEY=your_bob_api_key_here

# GitHub API (optional but recommended)
GITHUB_TOKEN=your_github_personal_access_token

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

---

## 🔧 Step-by-Step Setup Instructions

### 1️⃣ IBM watsonx.ai Credentials

#### **What you need:**
- `IBM_WATSONX_API_KEY` - Your IBM Cloud API key
- `IBM_WATSONX_PROJECT_ID` - Your watsonx project ID
- `IBM_WATSONX_URL` - The watsonx service endpoint (region-specific)

#### **How to get them:**

**Step 1: Create IBM Cloud Account**
1. Go to [IBM Cloud](https://cloud.ibm.com/)
2. Click **"Create an account"** (or sign in if you have one)
3. Complete the registration process
4. Verify your email address

**Step 2: Access watsonx.ai**
1. Log in to [IBM Cloud Console](https://cloud.ibm.com/)
2. In the top search bar, search for **"watsonx.ai"**
3. Click on **"watsonx.ai"** service
4. Click **"Launch watsonx.ai"** or **"Get started"**

**Step 3: Create a Project**
1. Once in watsonx.ai, click **"Projects"** in the left sidebar
2. Click **"New project"** button
3. Choose **"Create an empty project"**
4. Enter a project name (e.g., "AI Onboarding Assistant")
5. Add a description (optional)
6. Click **"Create"**

**Step 4: Get Project ID**
1. Open your newly created project
2. Click on the **"Manage"** tab
3. Look for **"General"** section
4. Copy the **Project ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
5. This is your `IBM_WATSONX_PROJECT_ID`

**Step 5: Create API Key**
1. In IBM Cloud Console, click your profile icon (top right)
2. Select **"Manage"** → **"Access (IAM)"**
3. In the left sidebar, click **"API keys"**
4. Click **"Create"** button
5. Enter a name (e.g., "watsonx-onboarding-key")
6. Add a description (optional)
7. Click **"Create"**
8. **IMPORTANT:** Copy the API key immediately (you won't see it again!)
9. This is your `IBM_WATSONX_API_KEY`

**Step 6: Determine Your Region URL**

Your `IBM_WATSONX_URL` depends on your IBM Cloud region:

| Region | URL |
|--------|-----|
| **US South (Dallas)** | `https://us-south.ml.cloud.ibm.com` |
| **US East (Washington DC)** | `https://us-east.ml.cloud.ibm.com` |
| **EU Germany (Frankfurt)** | `https://eu-de.ml.cloud.ibm.com` |
| **EU United Kingdom (London)** | `https://eu-gb.ml.cloud.ibm.com` |
| **Japan (Tokyo)** | `https://jp-tok.ml.cloud.ibm.com` |

To find your region:
1. Go to IBM Cloud Console
2. Look at the URL or check your resource list
3. Your region is usually shown in the dashboard

**Common Issues:**
- ❌ **"Invalid API key"** → Make sure you copied the entire key
- ❌ **"Project not found"** → Verify the Project ID is correct
- ❌ **"Region error"** → Check your watsonx URL matches your IBM Cloud region

---

### 2️⃣ IBM Bob API Key (Optional)

IBM Bob might be part of watsonx or a separate service. 

**If Bob is separate:**
1. Follow similar steps as watsonx
2. Create a separate API key for Bob
3. Add it as `IBM_BOB_API_KEY`

**If Bob is integrated with watsonx:**
- You can use the same API key
- Set `IBM_BOB_API_KEY` to the same value as `IBM_WATSONX_API_KEY`
- Or leave it empty if not needed

---

### 3️⃣ GitHub Personal Access Token (Optional but Recommended)

#### **Why you need it:**
- **Without token:** 60 API requests per hour
- **With token:** 5,000 API requests per hour

#### **How to get it:**

**Step 1: Go to GitHub Settings**
1. Log in to [GitHub](https://github.com/)
2. Click your profile picture (top right)
3. Select **"Settings"**

**Step 2: Create Personal Access Token**
1. Scroll down to **"Developer settings"** (bottom of left sidebar)
2. Click **"Personal access tokens"**
3. Click **"Tokens (classic)"**
4. Click **"Generate new token"** → **"Generate new token (classic)"**

**Step 3: Configure Token**
1. **Note:** Enter a description (e.g., "AI Onboarding Assistant")
2. **Expiration:** Choose duration (recommend 90 days or No expiration for development)
3. **Select scopes:**
   - ✅ Check **`public_repo`** (Access public repositories)
   - ✅ Check **`read:org`** (Read org data - optional)
4. Scroll down and click **"Generate token"**

**Step 4: Copy Token**
1. **IMPORTANT:** Copy the token immediately (starts with `ghp_`)
2. You won't be able to see it again!
3. This is your `GITHUB_TOKEN`

**Token Format:** `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Security Tips:**
- ✅ Never commit tokens to Git
- ✅ Use different tokens for different projects
- ✅ Regenerate tokens periodically
- ✅ Revoke tokens you're not using

---

### 4️⃣ Server Configuration

These are straightforward:

**PORT** (default: 5000)
- The port your backend server will run on
- Change if 5000 is already in use
- Example: `PORT=3001`

**NODE_ENV** (default: development)
- Set to `development` for local development
- Set to `production` for deployment
- Example: `NODE_ENV=development`

**FRONTEND_URL** (default: http://localhost:3000)
- The URL where your Next.js frontend runs
- Used for CORS configuration
- Example: `FRONTEND_URL=http://localhost:3000`

---

## 📝 Configuration Files

### Backend Configuration

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit the .env file:**
   ```bash
   # Windows
   notepad .env
   
   # Mac/Linux
   nano .env
   # or
   vim .env
   ```

4. **Paste your credentials:**
   ```env
   PORT=5000
   NODE_ENV=development
   
   IBM_WATSONX_API_KEY=paste_your_actual_key_here
   IBM_WATSONX_PROJECT_ID=paste_your_project_id_here
   IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com
   
   GITHUB_TOKEN=paste_your_github_token_here
   
   FRONTEND_URL=http://localhost:3000
   ```

5. **Save the file**

### Frontend Configuration

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Copy the example file:**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Edit if needed:**
   ```bash
   # Usually the default is fine
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   ```

---

## ✅ Verification Checklist

Before starting the application, verify:

- [ ] IBM Cloud account created
- [ ] watsonx.ai project created
- [ ] IBM API key generated and copied
- [ ] Project ID copied from watsonx
- [ ] Region URL identified
- [ ] GitHub token generated (optional)
- [ ] `backend/.env` file created with all values
- [ ] `frontend/.env.local` file created
- [ ] No placeholder text (like `your_key_here`) remains
- [ ] All keys are properly formatted (no extra spaces)

---

## 🧪 Testing Your Configuration

After setting up environment variables:

1. **Test Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   
   You should see:
   ```
   ==================================================
   🚀 AI Developer Onboarding Assistant
   ==================================================
   Server running on port 5000
   Environment: development
   Frontend URL: http://localhost:3000
   ==================================================
   ```

2. **Test Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   
   You should see:
   ```
   - Local:        http://localhost:3000
   - Network:      http://192.168.x.x:3000
   ```

3. **Test API Connection:**
   - Open browser to `http://localhost:5000/health`
   - You should see: `{"status":"healthy","timestamp":"...","uptime":...}`

---

## 🚨 Troubleshooting

### "Invalid API Key" Error
- ✅ Check for extra spaces or line breaks
- ✅ Ensure you copied the entire key
- ✅ Verify the key hasn't expired
- ✅ Try regenerating the key

### "Project Not Found" Error
- ✅ Verify Project ID is correct
- ✅ Ensure project exists in watsonx
- ✅ Check you're using the right IBM Cloud account

### "Rate Limit Exceeded" (GitHub)
- ✅ Add a GitHub token to increase limit
- ✅ Wait an hour for rate limit to reset
- ✅ Check token has correct permissions

### "CORS Error" in Browser
- ✅ Verify `FRONTEND_URL` in backend `.env`
- ✅ Ensure both servers are running
- ✅ Check ports match (3000 for frontend, 5000 for backend)

### "Module Not Found" Errors
- ✅ Run `npm install` in both directories
- ✅ Delete `node_modules` and reinstall
- ✅ Check Node.js version (need 18+)

---

## 🔒 Security Best Practices

1. **Never commit .env files to Git**
   - Already in `.gitignore`
   - Double-check before pushing

2. **Use different keys for different environments**
   - Development keys
   - Production keys
   - Testing keys

3. **Rotate keys regularly**
   - Every 90 days recommended
   - Immediately if compromised

4. **Limit key permissions**
   - Only grant necessary scopes
   - Use separate keys for different services

5. **Monitor key usage**
   - Check IBM Cloud usage dashboard
   - Review GitHub token activity

---

## 📞 Need Help?

- **IBM watsonx Documentation:** [https://www.ibm.com/docs/en/watsonx-as-a-service](https://www.ibm.com/docs/en/watsonx-as-a-service)
- **GitHub Token Docs:** [https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- **IBM Cloud Support:** [https://cloud.ibm.com/unifiedsupport/supportcenter](https://cloud.ibm.com/unifiedsupport/supportcenter)

---

## ✨ Quick Start Summary

```bash
# 1. Get credentials (follow guide above)
# 2. Configure backend
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install

# 3. Configure frontend
cd ../frontend
cp .env.local.example .env.local
npm install

# 4. Start development
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev

# 5. Open browser
# http://localhost:3000
```

---

**🎉 You're all set! Happy coding!**