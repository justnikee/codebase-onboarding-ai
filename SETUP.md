# 🚀 Setup Guide

Follow these steps to set up the AI Developer Onboarding Assistant on your local machine.

## Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**
- **IBM Cloud Account** with watsonx access
- **GitHub Account** (optional, for higher API rate limits)

## Step 1: Install Dependencies

### Backend Setup

```bash
cd backend
npm install
```

This will install:
- Express.js for the API server
- TypeScript and tsx for development
- IBM watsonx SDK
- Axios for HTTP requests
- CORS for cross-origin requests
- dotenv for environment variables

### Frontend Setup

```bash
cd frontend
npm install
```

This will install:
- Next.js 14 with React 18
- TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Axios for API calls

## Step 2: Configure Environment Variables

### Backend Configuration

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `backend/.env` and add your credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# IBM Watson Configuration
IBM_WATSONX_API_KEY=your_actual_api_key_here
IBM_WATSONX_PROJECT_ID=your_actual_project_id_here
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com

# IBM Bob Configuration (if separate from watsonx)
IBM_BOB_API_KEY=your_bob_api_key_here

# GitHub API (optional - increases rate limit from 60 to 5000 requests/hour)
GITHUB_TOKEN=your_github_personal_access_token

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

#### How to Get IBM Credentials:

1. Go to [IBM Cloud](https://cloud.ibm.com/)
2. Navigate to watsonx.ai
3. Create a project or select an existing one
4. Go to "Manage" → "Access (IAM)" → "API keys"
5. Create a new API key
6. Copy the Project ID from your watsonx project settings

#### How to Get GitHub Token (Optional):

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scope: `public_repo` (for public repositories)
4. Copy the token

### Frontend Configuration

1. Copy the example environment file:
```bash
cd frontend
cp .env.local.example .env.local
```

2. The default configuration should work:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## Step 3: Start Development Servers

### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:5000`

You should see:
```
Server running on port 5000
```

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

You should see:
```
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

## Step 4: Verify Setup

1. Open your browser and go to `http://localhost:3000`
2. You should see the AI Developer Onboarding Assistant home page
3. Try analyzing a repository (e.g., `https://github.com/vercel/next.js`)

## Troubleshooting

### Port Already in Use

If port 5000 or 3000 is already in use:

**Backend:**
```bash
# Change PORT in backend/.env
PORT=5001
```

**Frontend:**
```bash
# Run on different port
npm run dev -- -p 3001
```

### TypeScript Errors

TypeScript errors in the IDE are normal before installing dependencies. They will disappear after running `npm install`.

### IBM API Errors

If you get authentication errors:
1. Verify your API key is correct
2. Check that your project ID matches your watsonx project
3. Ensure your IBM Cloud account has watsonx access
4. Check the watsonx URL matches your region

### GitHub Rate Limit

Without a GitHub token, you're limited to 60 requests/hour. If you hit the limit:
1. Wait an hour, or
2. Add a GitHub personal access token to `backend/.env`

### CORS Errors

If you see CORS errors in the browser console:
1. Verify `FRONTEND_URL` in `backend/.env` matches your frontend URL
2. Restart the backend server after changing environment variables

## Next Steps

Once setup is complete:

1. **Test the application** with different repositories
2. **Customize the UI** in `frontend/src/app/`
3. **Enhance AI prompts** in `backend/src/services/`
4. **Add new features** based on your requirements

## Production Deployment

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md) (to be created).

## Need Help?

- Check the main [README.md](./README.md) for architecture details
- Review the [STARTING.MD](./STARTING.MD) for the project plan
- Open an issue on GitHub

---

Happy coding! 🚀