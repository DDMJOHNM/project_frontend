# OpenAI API Key Setup via GitHub Secrets

This guide explains how to configure the OpenAI API key using GitHub Secrets for secure deployment.

## Overview

The OpenAI API key is stored securely in:
1. **GitHub Secrets** - For deployment automation
2. **AWS Secrets Manager** - For Lambda functions (synced from GitHub during deployment)

## Step 1: Add OpenAI Key to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-...`)
5. Click **Add secret**

## Step 2: How It Works

### During Deployment

When you push to `main` or trigger the workflow:

1. **GitHub Actions** reads `OPENAI_API_KEY` from GitHub Secrets
2. **Automatically syncs** it to AWS Secrets Manager at `whatsthescore/openai-api-key`
3. **Lambda functions** (if deployed) read from AWS Secrets Manager
4. **API routes** can access it via environment variables

### For Local Development

Create a `.env.local` file:

```env
OPENAI_API_KEY=sk-your-actual-key-here
```

**Important**: Never commit `.env.local` to git (it's already in `.gitignore`)

## Step 3: AWS Secrets Manager

The deployment workflow automatically:

- **Creates** the secret in AWS Secrets Manager if it doesn't exist
- **Updates** the secret if it already exists
- **Stores** it at: `whatsthescore/openai-api-key`

### Manual Update (Optional)

If you need to update it manually:

```bash
aws secretsmanager put-secret-value \
  --secret-id whatsthescore/openai-api-key \
  --secret-string "sk-your-new-key" \
  --region us-east-1
```

## Step 4: Using the Key

### In API Routes (Server-Side)

Your API routes (`app/api/transcribe/route.ts` and `app/api/agent/route.ts`) already use:

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
```

This works for:
- **Local development**: Reads from `.env.local`
- **Production**: Reads from AWS Secrets Manager (via Lambda) or environment variables

### For Lambda Functions

If you deploy API routes as Lambda functions (via Terraform), they automatically read from AWS Secrets Manager using the code in `app/api/transcribe/route.ts` and `app/api/agent/route.ts`.

## Security Best Practices

✅ **DO:**
- Store the key in GitHub Secrets
- Use AWS Secrets Manager for production
- Rotate keys regularly (every 90 days)
- Use different keys for dev/staging/prod if needed

❌ **DON'T:**
- Commit the key to git
- Hardcode the key in source code
- Share the key in chat/email
- Use the same key across multiple projects

## Troubleshooting

### Key Not Found Error

**Error**: `Missing credentials. Please pass an apiKey`

**Solution**:
1. Verify `OPENAI_API_KEY` is set in GitHub Secrets
2. Check the deployment logs for Secrets Manager sync
3. Verify AWS IAM permissions for Secrets Manager

### Secrets Manager Permission Error

**Error**: `AccessDenied` when updating secret

**Solution**:
Your IAM user `github-actions-deploy-front-user` needs:
```json
{
  "Effect": "Allow",
  "Action": [
    "secretsmanager:GetSecretValue",
    "secretsmanager:PutSecretValue",
    "secretsmanager:CreateSecret",
    "secretsmanager:DescribeSecret"
  ],
  "Resource": "arn:aws:secretsmanager:*:*:secret:whatsthescore/openai-api-key*"
}
```

### Local Development Issues

**Error**: Key not found locally

**Solution**:
1. Create `.env.local` file in project root
2. Add: `OPENAI_API_KEY=sk-your-key`
3. Restart your dev server

## Verification

After deployment, verify the secret is in AWS:

```bash
aws secretsmanager get-secret-value \
  --secret-id whatsthescore/openai-api-key \
  --region us-east-1 \
  --query SecretString \
  --output text
```

This should return your OpenAI API key (without the `sk-` prefix visible in logs for security).

