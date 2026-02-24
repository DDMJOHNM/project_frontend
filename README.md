# Positive Thought Counselling - Mental Health Counselling Client Management System

## Architecture Overview  - Onboarding Module

The system uses a Next.js frontend that integrates an OpenAI-powered onboarding assistant. Users provide their details in natural language (voice or text), which the frontend sends directly to an OpenAI agent. The agent extracts structured fields (first name, last name, email) and returns them to the UI for user review. Once confirmed, the frontend sends the validated payload to a Go backend service exposed via AWS API Gateway. The backend performs additional validation and persists the client record in DynamoDB. The entire backend stack is deployed through GitHub Actions and provisioned using Makefile-driven AWS infrastructure.

```
┌──────────────────────────┐
│          User            │
│  (speaks info)  │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│        Next.js Frontend (Client UI)          │
│  - Chat-style onboarding assistant            │
│  - Transcript + Detected Details              │
│  - State management + validation              │
└─────────────┬────────────────────────────────┘
              │ Prompt + conversation context
              ▼
┌──────────────────────────────────────────────┐
│          OpenAI Agent / LLM                  │
│  - Natural language → structured fields       │
│  - Extracts: first name, last name, email     │
│  - Returns JSON-like structured output        │
└─────────────┬────────────────────────────────┘
              │ Structured fields
              ▼
┌──────────────────────────────────────────────┐
│        Next.js Frontend (Review Step)        │
│  - Shows parsed fields                        │
│  - User confirms or edits                     │
└─────────────┬────────────────────────────────┘
              │ Validated payload
              ▼
┌──────────────────────────────────────────────┐
│      AWS API Gateway (HTTPS endpoint)        │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│   Go Backend Service (johns_ai_project_backend) │
│  - Validation                                  │
│  - Business logic                              │
│  - Error handling                              │
│  - Persistence layer                           │
└─────────────┬────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│        DynamoDB (Client Records)             │
│  - First name                                 │
│  - Last name                                  │
│  - Email                                      │
│  - Metadata                                   │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ GitHub Actions CI/CD                         │
│ - Build & test                                │
│ - Deploy backend to AWS                       │
│ - Provision infra via Makefile/Terraform      │
└──────────────────────────────────────────────┘


## Architecture Overview  - Client Introductory Notes

## Architecture Overview - Counsellor Recommendation Module And Calendar Appointment

**✅ IMPLEMENTED!** AI-powered counsellor matching using LangChain + Vector Database

Matches clients with the right mental health counsellor based on their concerns. Includes 7 counsellors specializing in: anxiety, depression, trauma/PTSD, grief, couples therapy, addiction, OCD, and child/adolescent issues.

### Local Development (ChromaDB - Free)
```bash
# Option 1: In-Memory (No Docker needed!)
USE_LOCAL_VECTOR_DB=true
CHROMA_IN_MEMORY=true
npm run seed:counselling && npm run dev

# Option 2: Docker ChromaDB (persistent data)
docker run -d -p 8001:8000 -e CHROMA_SERVER_CORS_ALLOW_ORIGINS='["*"]' chromadb/chroma
CHROMA_URL=http://localhost:8001
CHROMA_IN_MEMORY=false
USE_LOCAL_VECTOR_DB=true
npm run seed:counselling && npm run dev
```

### AWS Production Deployment (Pinecone - Free Tier)
```bash
# 1. Get Pinecone API key from pinecone.io (FREE - no minimum)
# 2. Add to Amplify environment variables:
#    - USE_LOCAL_VECTOR_DB=false
#    - PINECONE_API_KEY=your-key
# 3. Seed production database (run locally once):
USE_LOCAL_VECTOR_DB=false npm run seed:counselling
# 4. Push to GitHub (auto-deploys to Amplify)
```

**Cost:** $0/month (both ChromaDB & Pinecone free tiers) + ~$5-20/month (OpenAI only)

📖 **Full Guide:** [HYBRID_SETUP_GUIDE.md](HYBRID_SETUP_GUIDE.md)

## Architecture Overview  - Client Image Upload And Findings

## Architecture Overview  - Client Profile and Reports

Image Simularity also vector Db chat gtp can only deduce from texture/color  
Face hugging Model Local and deployed 

```
## Overview

This Next.js application is deployed on **AWS Amplify** with full support for:
- ✅ API Routes (server-side functions)
- ✅ Server-side rendering
- ✅ Automatic deployments from GitHub
- ✅ SSL certificates
- ✅ Environment variables

**Frontend Repository**: [https://github.com/DDMJOHNM/project_frontend](https://github.com/DDMJOHNM/project_frontend)  
**Backend Repository**: [https://github.com/DDMJOHNM/johns_ai_project_backend](https://github.com/DDMJOHNM/johns_ai_project_backend)

---

## 🚀 AWS Amplify Deployment

### Current Setup

Your app is deployed at:
- **Amplify URL**: `https://main.xxxxx.amplifyapp.com`
- **Custom Domain**: `duskaotearoa.co.nz` (configured in Amplify Console)

### Automatic Deployments

Every push to the `main` branch automatically:
1. Triggers a new build in AWS Amplify
2. Runs `pnpm install` and `pnpm build`
3. Deploys the new version
4. Updates the live site

**No manual deployment needed!** Just push your code.

---

## 🔑 Environment Variables

### Required Variables

Set these in **Amplify Console → App Settings → Environment variables**:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key (starts with `sk-`) | ✅ Yes |
| `BACKEND_URL` | Backend API URL for authentication | ✅ Yes |
| `NEXT_PUBLIC_BACKEND_URL` | Public backend URL (client-side) | ⚠️ Optional |

### How to Update Environment Variables

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app
3. Click **"Environment variables"** (left sidebar)
4. Click **"Manage variables"**
5. Add/edit variables
6. Click **"Save"**
7. **Redeploy** the app (required for changes to take effect)

### Triggering a Redeploy

**Option A: Git Push**
```bash
git commit --allow-empty -m "Redeploy with updated env vars"
git push
```

**Option B: Amplify Console**

1. Go to your app in Amplify Console
2. Find the latest deployment
3. Click **"..."** → **"Redeploy this version"**

---

## 🖥️ Local Development

### Prerequisites

- **Node.js**: Version 20 or higher ([Download](https://nodejs.org/))
- **pnpm**: Package manager ([Install](https://pnpm.io/installation))
  ```bash
  npm install -g pnpm
  ```
- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Backend Running** (optional): For authentication testing

### Step-by-Step Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/DDMJOHNM/project_frontend.git
cd project_frontend
```

#### 2. Install Dependencies

```bash
pnpm install
```

This will install all required packages including:

- Next.js 14
- React 18
- OpenAI SDK
- TypeScript
- Tailwind CSS

#### 3. Create Environment Variables File

Create a `.env.local` file in the project root:

```bash
touch .env.local
```

Add the following variables:

```env
# Required: Your OpenAI API key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Backend URL for authentication
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080

# Or use your deployed backend:
# NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

**Important**: Never commit `.env.local` to git (it's already in `.gitignore`)

#### 4. Start the Development Server

```bash
pnpm dev
```

You should see:

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
```

#### 5. Open Your Browser

Navigate to [http://localhost:3000](http://localhost:3000)

The page will auto-reload when you make changes to the code.

### Available Scripts

```bash
# Start development server (with hot reload)
pnpm dev

# Build for production
pnpm build

# Start production server (after build)
pnpm start

# Run type checking
pnpm type-check

# Run linter
pnpm lint
```

### Testing API Routes Locally

#### Test Transcription (without backend)

1. Open [http://localhost:3000](http://localhost:3000)
2. Click the microphone button
3. Speak into your microphone
4. The audio will be transcribed using OpenAI Whisper API

**Note**: Requires `OPENAI_API_KEY` in `.env.local`

#### Test Authentication (requires backend)

1. Make sure your backend is running at `http://localhost:8080` (or your configured URL)
2. Open the app and click "Login"
3. Enter credentials
4. The `/api/login` route will call your backend

**Without Backend**: Authentication will fail, but other features (transcription, AI agent) will work.

### Local Development with Backend

If you want to test the full app with authentication:

**Option 1: Run Backend Locally**

```bash
# In a separate terminal, start your backend
cd path/to/backend
# Follow backend setup instructions
npm start  # or whatever command your backend uses
```

**Option 2: Use Deployed Backend**

```env
# In .env.local, use your deployed backend URL
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

### Common Issues & Solutions

#### Port Already in Use

```bash
# Error: Port 3000 is already in use
# Solution: Use a different port
PORT=3001 pnpm dev
```

#### Module Not Found

```bash
# Solution: Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm dev
```

#### OpenAI API Key Not Working

```bash
# Check if .env.local exists and has the correct format
cat .env.local

# Restart the dev server after adding the key
# Press Ctrl+C to stop, then run:
pnpm dev
```

#### CORS Errors with Backend

- Make sure your backend allows `http://localhost:3000` in CORS origins
- Check backend console logs for CORS errors

### Development Tips

**Hot Reload**: Code changes auto-reload, but environment variable changes require restart

**API Route Logs**: Check your terminal for server-side logs from API routes

**Client Logs**: Check browser console (F12) for client-side errors

**VS Code Extensions** (recommended):

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

### Environment Variables Reference


| Variable                  | Required    | Used For                 | Example                 |
| ------------------------- | ----------- | ------------------------ | ----------------------- |
| `OPENAI_API_KEY`          | ✅ Yes       | Transcription & AI agent | `sk-proj-xxx...`        |
| `NEXT_PUBLIC_BACKEND_URL` | ⚠️ Optional | Authentication API       | `http://localhost:8080` |


**Note**: Variables prefixed with `NEXT_PUBLIC_` are accessible in the browser. Never put secrets there!

---

## 🔗 Backend Configuration

### Backend API

This frontend connects to an external backend for authentication:

- **Repository**: [https://github.com/DDMJOHNM/johns_ai_project_backend](https://github.com/DDMJOHNM/johns_ai_project_backend)
- **Endpoint Used**: `POST /login` (user authentication)

### API Routes Overview


| Route             | Purpose             | Calls               |
| ----------------- | ------------------- | ------------------- |
| `/api/login`      | User authentication | External backend    |
| `/api/transcribe` | Audio transcription | OpenAI API directly |
| `/api/agent`      | AI agent            | OpenAI API directly |


### Backend CORS Configuration

Your backend must allow requests from:

- **Production**: `https://duskaotearoa.co.nz`
- **Amplify**: `https://main.xxxxx.amplifyapp.com`
- **Local**: `http://localhost:3000`

**Example CORS config** (adjust for your backend framework):

```javascript
const corsOptions = {
  origin: [
    'https://duskaotearoa.co.nz',
    'https://main.xxxxx.amplifyapp.com', // Your Amplify URL
    'http://localhost:3000' // For local development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
```

---

## 📊 Monitoring & Logs

### View Build Logs

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click on your app
3. Click on a deployment in the list
4. View logs for each build phase

### View Runtime Logs (API Routes)

1. In Amplify Console, click **"Monitoring"**
2. Click **"View logs in CloudWatch"**
3. Select the log stream for your API route
4. View error messages and debugging info

---

## 🛠️ Troubleshooting

### Build Fails in Amplify

**Check:**

- Environment variables are set correctly
- `amplify.yml` is present in the root
- Dependencies install successfully
- Build logs for specific errors

### API Routes Return Errors

**Check:**

- Environment variables are set in Amplify Console
- You've redeployed after setting env vars
- CloudWatch logs for error details
- CORS configuration on backend

### "OPENAI_API_KEY environment variable is not set"

**Solution:**

1. Go to Amplify Console → Environment variables
2. Verify `OPENAI_API_KEY` is set with a value (not just the name)
3. Redeploy the app (push empty commit or redeploy in console)
4. Wait for build to complete
5. Test again

### Backend Connection Issues

**Check:**

- Backend URL is correct in environment variables
- Backend is running and accessible
- CORS is configured on backend
- Backend allows HTTPS requests (if using HTTPS frontend)

---

## 📁 Project Structure

```
├── app/                      # Next.js app directory
│   ├── api/                  # API routes (server-side)
│   │   ├── login/           # Authentication (calls backend)
│   │   ├── transcribe/      # Audio transcription (calls OpenAI)
│   │   └── agent/           # AI agent (calls OpenAI)
│   ├── components/          # React components
│   └── page.tsx            # Main page
├── amplify.yml              # Amplify build configuration
├── next.config.mjs          # Next.js configuration
└── .github/
    └── workflows/
        └── deploy.yml       # GitHub Actions (disabled, using Amplify)
```

---

## 🔐 Security Notes

- ✅ API keys stored in Amplify environment variables (encrypted)
- ✅ HTTPS enforced via Amplify
- ✅ Server-side API routes (not exposed to client)
- ✅ CORS configured on backend
- ✅ Authentication via external backend

---

## 📝 Key Configuration Files

### `amplify.yml`

Configures Amplify build process:

- Installs pnpm globally
- Runs `pnpm install` and `pnpm build`
- Caches `node_modules` and `.next/cache`

### `next.config.mjs`

Next.js configuration:

- No `output: 'export'` (allows API routes)
- Explicitly includes environment variables for Lambda functions
- Optimized images settings

---

## 🚀 Deployment Checklist

Before deploying:

- Environment variables set in Amplify Console
- Backend is deployed and accessible
- CORS configured on backend
- Code pushed to `main` branch
- Build completes successfully in Amplify
- API routes tested and working
- Custom domain configured (if needed)

---

## 📞 Support

**Issues?**

- Check Amplify build logs
- Check CloudWatch logs for API routes
- Review environment variables
- Verify backend is running
- Check CORS configuration

**AWS Account**: `051826704696`  
**Region**: `us-east-1`

---

## 🎯 Quick Commands

```bash
# Local development
pnpm dev

# Build locally
pnpm build

# Trigger redeploy
git commit --allow-empty -m "Redeploy"
git push

# View Amplify logs
# Go to: https://console.aws.amazon.com/amplify/
```

---

**Your app auto-deploys on every push to `main`!** 🚀