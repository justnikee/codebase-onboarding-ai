# 🚀 Environment Variables - Quick Reference

## Backend (.env)

```bash
# Copy this template to backend/.env and fill in your values

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=5000
NODE_ENV=development

# ============================================
# IBM WATSONX.AI CREDENTIALS
# ============================================
# Get from: https://cloud.ibm.com/
# 1. Create account → watsonx.ai → Create Project
# 2. Manage → Access (IAM) → API keys → Create
# 3. Copy Project ID from project settings
IBM_WATSONX_API_KEY=
IBM_WATSONX_PROJECT_ID=
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com

# ============================================
# IBM BOB (Optional - if separate from watsonx)
# ============================================
IBM_BOB_API_KEY=

# ============================================
# GITHUB TOKEN (Optional but Recommended)
# ============================================
# Get from: https://github.com/settings/tokens
# Settings → Developer settings → Personal access tokens
# Scopes needed: public_repo
# Increases rate limit from 60 to 5000 requests/hour
GITHUB_TOKEN=

# ============================================
# CORS CONFIGURATION
# ============================================
FRONTEND_URL=http://localhost:3000
```

## Frontend (.env.local)

```bash
# Copy this template to frontend/.env.local

NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

---

## 📍 Where to Get Each Variable

| Variable | Where to Get It | Required? |
|----------|----------------|-----------|
| `IBM_WATSONX_API_KEY` | IBM Cloud → IAM → API Keys | ✅ Yes |
| `IBM_WATSONX_PROJECT_ID` | watsonx.ai → Project → Manage → General | ✅ Yes |
| `IBM_WATSONX_URL` | Based on your IBM Cloud region | ✅ Yes |
| `IBM_BOB_API_KEY` | IBM Cloud (if Bob is separate) | ⚠️ Maybe |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings | 🟡 Optional |
| `PORT` | Choose any available port | ✅ Yes |
| `NODE_ENV` | Set to `development` or `production` | ✅ Yes |
| `FRONTEND_URL` | Your Next.js app URL | ✅ Yes |

---

## 🌍 IBM watsonx Region URLs

Choose based on your IBM Cloud region:

```bash
# US South (Dallas) - Most common
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com

# US East (Washington DC)
IBM_WATSONX_URL=https://us-east.ml.cloud.ibm.com

# EU Germany (Frankfurt)
IBM_WATSONX_URL=https://eu-de.ml.cloud.ibm.com

# EU United Kingdom (London)
IBM_WATSONX_URL=https://eu-gb.ml.cloud.ibm.com

# Japan (Tokyo)
IBM_WATSONX_URL=https://jp-tok.ml.cloud.ibm.com
```

---

## ⚡ Quick Setup Commands

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev

# Frontend (in new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

---

## ✅ Validation Checklist

Before running the app:

- [ ] All required variables are filled (no `your_key_here` placeholders)
- [ ] IBM API key is valid (starts with letters/numbers, no spaces)
- [ ] Project ID is in UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
- [ ] Region URL matches your IBM Cloud region
- [ ] GitHub token starts with `ghp_` (if using)
- [ ] Ports are not in use by other applications
- [ ] Both .env files are created (backend/.env and frontend/.env.local)

---

## 🔗 Quick Links

- **IBM Cloud Console:** https://cloud.ibm.com/
- **watsonx.ai:** https://dataplatform.cloud.ibm.com/wx/home
- **GitHub Tokens:** https://github.com/settings/tokens
- **Full Setup Guide:** See `ENV_SETUP_GUIDE.md`

---

## 🆘 Common Issues

**"Invalid API Key"**
→ Check for spaces, ensure full key is copied

**"Project Not Found"**
→ Verify Project ID, check IBM Cloud account

**"Rate Limit Exceeded"**
→ Add GitHub token or wait 1 hour

**"CORS Error"**
→ Check FRONTEND_URL matches your Next.js port

---

**Need detailed instructions?** See `ENV_SETUP_GUIDE.md`