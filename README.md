# WhatsTheScore - Deployment Guide

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

- Node.js 20+
- pnpm (or npm/yarn)

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/DDMJOHNM/project_frontend.git
   cd project_frontend
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Create `.env.local`** file:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
   # Or your deployed backend URL
   ```

4. **Run development server**:
   ```bash
   pnpm dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

---

## 🔗 Backend Configuration

### Backend API

This frontend connects to an external backend for authentication:
- **Repository**: [https://github.com/DDMJOHNM/johns_ai_project_backend](https://github.com/DDMJOHNM/johns_ai_project_backend)
- **Endpoint Used**: `POST /login` (user authentication)

### API Routes Overview

| Route | Purpose | Calls |
|-------|---------|-------|
| `/api/login` | User authentication | External backend |
| `/api/transcribe` | Audio transcription | OpenAI API directly |
| `/api/agent` | AI agent | OpenAI API directly |

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

## 🧹 Cleanup Old AWS Resources

Since you're now using Amplify, you can delete these old resources:

### Safe to Delete

| Resource | Reason | How to Delete |
|----------|--------|---------------|
| **CloudFront Distribution** `E209UM3L4LHZOE` | Amplify has its own CDN | AWS Console → CloudFront → Disable → Delete |
| **S3 Bucket** `duskaotearoa.co.nz` | Amplify hosts your files | AWS Console → S3 → Empty → Delete |
| **ACM Certificate** | Amplify provides SSL | AWS Console → Certificate Manager → Delete |

### Keep These

| Resource | Reason |
|----------|--------|
| **Terraform State** (`duskaotearoa-terraform-state`) | For infrastructure history |
| **DynamoDB Table** (`terraform-state-lock`) | For Terraform state locking |

### Cleanup Steps

**1. Comment out old resources in Terraform:**

The old S3/CloudFront resources in `terraform/main.tf` are already commented out.

**2. Optional - Clean up via Terraform:**
```bash
cd terraform
terraform apply  # This will remove the commented resources
```

**3. Optional - Manual cleanup in AWS Console:**
- Go to CloudFront → Disable distribution → Wait 5-10 mins → Delete
- Go to S3 → Empty bucket → Delete bucket
- Go to ACM → Delete certificate

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
├── terraform/               # Infrastructure as code (old S3/CloudFront)
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
- [ ] Environment variables set in Amplify Console
- [ ] Backend is deployed and accessible
- [ ] CORS configured on backend
- [ ] Code pushed to `main` branch
- [ ] Build completes successfully in Amplify
- [ ] API routes tested and working
- [ ] Custom domain configured (if needed)

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
