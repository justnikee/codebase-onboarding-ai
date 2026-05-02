# 🚀 Deployment Guide

Complete guide for deploying the AI Developer Onboarding Assistant to production.

## 📋 Pre-Deployment Checklist

- [ ] All tests passing (see TESTING_GUIDE.md)
- [ ] Real IBM watsonx credentials obtained
- [ ] GitHub token configured (optional but recommended)
- [ ] Environment variables documented
- [ ] Database/storage solution chosen (if needed)
- [ ] Domain name registered (if applicable)
- [ ] SSL certificate ready

---

## 🎯 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)
**Best for:** Quick deployment, automatic scaling
**Cost:** Free tier available

### Option 2: AWS (Full Stack)
**Best for:** Enterprise, full control
**Cost:** Pay as you go

### Option 3: Docker + Any Cloud Provider
**Best for:** Flexibility, portability
**Cost:** Varies by provider

### Option 4: Heroku (Full Stack)
**Best for:** Simplicity
**Cost:** Paid plans required

---

## 🔧 Option 1: Vercel + Railway (Recommended)

### Part A: Deploy Backend to Railway

**Step 1: Prepare Backend**
```bash
cd backend

# Create .env.production
cat > .env.production << EOF
NODE_ENV=production
PORT=5000
USE_MOCK_WATSONX=false
IBM_WATSONX_API_KEY=your_real_key
IBM_WATSONX_PROJECT_ID=your_real_project_id
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com
GITHUB_TOKEN=your_github_token
FRONTEND_URL=https://your-frontend-domain.vercel.app
EOF
```

**Step 2: Create Railway Account**
1. Go to https://railway.app/
2. Sign up with GitHub
3. Create new project

**Step 3: Deploy**
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Select `backend` directory
5. Add environment variables from .env.production
6. Deploy!

**Step 4: Get Backend URL**
```
Your backend will be at: https://your-app.railway.app
```

### Part B: Deploy Frontend to Vercel

**Step 1: Prepare Frontend**
```bash
cd frontend

# Update .env.production
cat > .env.production << EOF
NEXT_PUBLIC_BACKEND_URL=https://your-app.railway.app
EOF
```

**Step 2: Create Vercel Account**
1. Go to https://vercel.com/
2. Sign up with GitHub
3. Import project

**Step 3: Deploy**
1. Click "New Project"
2. Import your GitHub repository
3. Select `frontend` directory
4. Add environment variable:
   - `NEXT_PUBLIC_BACKEND_URL`: Your Railway backend URL
5. Deploy!

**Step 4: Configure Domain**
1. Vercel provides: `your-app.vercel.app`
2. Or add custom domain in settings

**Step 5: Update Backend CORS**
1. Go to Railway dashboard
2. Update `FRONTEND_URL` environment variable
3. Set to your Vercel URL
4. Redeploy backend

---

## 🐳 Option 2: Docker Deployment

### Create Dockerfiles

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/server.js"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
```

**Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - USE_MOCK_WATSONX=false
      - IBM_WATSONX_API_KEY=${IBM_WATSONX_API_KEY}
      - IBM_WATSONX_PROJECT_ID=${IBM_WATSONX_PROJECT_ID}
      - IBM_WATSONX_URL=${IBM_WATSONX_URL}
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - FRONTEND_URL=http://localhost:3000
    volumes:
      - ./backend/src/storage:/app/src/storage

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://backend:5000
    depends_on:
      - backend
```

**Deploy:**
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## ☁️ Option 3: AWS Deployment

### Architecture
```
Internet → CloudFront → S3 (Frontend)
                     ↓
                  API Gateway → Lambda (Backend)
                     ↓
                  DynamoDB (Storage)
```

### Steps

**1. Deploy Backend to AWS Lambda**
```bash
# Install Serverless Framework
npm install -g serverless

# Create serverless.yml in backend/
cd backend
cat > serverless.yml << EOF
service: ai-onboarding-backend

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    NODE_ENV: production
    IBM_WATSONX_API_KEY: \${env:IBM_WATSONX_API_KEY}
    IBM_WATSONX_PROJECT_ID: \${env:IBM_WATSONX_PROJECT_ID}
    IBM_WATSONX_URL: \${env:IBM_WATSONX_URL}

functions:
  api:
    handler: dist/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
EOF

# Deploy
serverless deploy
```

**2. Deploy Frontend to S3 + CloudFront**
```bash
cd frontend

# Build
npm run build

# Upload to S3
aws s3 sync out/ s3://your-bucket-name/

# Create CloudFront distribution
# (Use AWS Console or CLI)
```

---

## 🔐 Environment Variables for Production

### Backend (.env.production)
```env
# Server
NODE_ENV=production
PORT=5000

# IBM watsonx (REQUIRED)
USE_MOCK_WATSONX=false
IBM_WATSONX_API_KEY=your_real_ibm_cloud_api_key
IBM_WATSONX_PROJECT_ID=your_watsonx_project_id
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com

# GitHub (RECOMMENDED)
GITHUB_TOKEN=your_github_personal_access_token

# CORS
FRONTEND_URL=https://your-frontend-domain.com

# Optional: Logging
LOG_LEVEL=info
```

### Frontend (.env.production)
```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

---

## 📊 Post-Deployment Checklist

### Functionality
- [ ] Can access frontend URL
- [ ] Can analyze repositories
- [ ] Dashboard displays correctly
- [ ] Chat works properly
- [ ] Error handling works
- [ ] All API endpoints responding

### Performance
- [ ] Page load times < 3 seconds
- [ ] API response times acceptable
- [ ] No memory leaks
- [ ] Proper caching configured

### Security
- [ ] HTTPS enabled
- [ ] Environment variables secure
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] API keys not exposed

### Monitoring
- [ ] Error tracking set up
- [ ] Performance monitoring active
- [ ] Logs accessible
- [ ] Alerts configured

---

## 📈 Monitoring & Logging

### Option 1: Vercel Analytics
```bash
# Install
npm install @vercel/analytics

# Add to frontend/src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Option 2: Sentry (Error Tracking)
```bash
# Install
npm install @sentry/nextjs @sentry/node

# Configure
# See: https://docs.sentry.io/
```

### Option 3: LogRocket (Session Replay)
```bash
# Install
npm install logrocket

# Initialize in frontend
import LogRocket from 'logrocket'
LogRocket.init('your-app-id')
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Deploy to Railway
        run: |
          cd backend
          npm ci
          npm run build
          # Railway CLI deployment
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Deploy to Vercel
        run: |
          cd frontend
          npm ci
          npm run build
          npx vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 🎯 Performance Optimization

### Frontend
```typescript
// Enable Next.js optimizations
// next.config.js
module.exports = {
  images: {
    domains: ['github.com'],
  },
  compress: true,
  poweredByHeader: false,
}
```

### Backend
```typescript
// Add compression
import compression from 'compression'
app.use(compression())

// Add caching headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300')
  next()
})
```

---

## 🔒 Security Best Practices

### 1. Environment Variables
- ✅ Never commit .env files
- ✅ Use different keys for dev/prod
- ✅ Rotate keys regularly
- ✅ Use secrets management (AWS Secrets Manager, etc.)

### 2. API Security
```typescript
// Add rate limiting
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

app.use('/api/', limiter)
```

### 3. CORS
```typescript
// Strict CORS in production
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'DELETE']
}))
```

### 4. Headers
```typescript
// Security headers
import helmet from 'helmet'
app.use(helmet())
```

---

## 📱 Domain & SSL

### Custom Domain Setup

**1. Purchase Domain**
- Namecheap, GoDaddy, Google Domains, etc.

**2. Configure DNS**
```
Type    Name    Value
A       @       Your-Server-IP
CNAME   www     your-app.vercel.app
```

**3. SSL Certificate**
- Vercel/Railway: Automatic
- Custom: Use Let's Encrypt

---

## 🐛 Troubleshooting Deployment

### Backend Not Responding
```bash
# Check logs
railway logs
# or
heroku logs --tail

# Check environment variables
railway variables
```

### Frontend Build Fails
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### CORS Errors
```bash
# Verify FRONTEND_URL in backend
echo $FRONTEND_URL

# Update and redeploy
railway variables set FRONTEND_URL=https://your-frontend.vercel.app
```

---

## 📊 Cost Estimation

### Free Tier (Development)
- Vercel: Free
- Railway: $5/month (500 hours)
- Total: ~$5/month

### Production (Low Traffic)
- Vercel Pro: $20/month
- Railway: $20/month
- Total: ~$40/month

### Production (High Traffic)
- Vercel Enterprise: Custom
- AWS/GCP: $100-500/month
- Total: $100-500+/month

---

## ✅ Deployment Success Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring set up
- [ ] Error tracking enabled
- [ ] Backups configured
- [ ] CI/CD pipeline working
- [ ] Documentation updated
- [ ] Team notified

---

## 🎉 Post-Deployment

### Share Your App
```
Frontend: https://your-app.vercel.app
Backend API: https://your-api.railway.app
Documentation: https://github.com/your-repo
```

### Monitor Usage
- Check analytics daily
- Review error logs
- Monitor performance
- Gather user feedback

### Iterate
- Fix bugs quickly
- Add requested features
- Optimize performance
- Update documentation

---

**🚀 Your app is now live! Monitor, iterate, and improve!**