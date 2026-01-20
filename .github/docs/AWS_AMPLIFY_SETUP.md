# AWS Amplify Deployment Guide

## Overview

AWS Amplify will host your Next.js app with full support for:
- ✅ API Routes (server-side functions)
- ✅ Server-side rendering
- ✅ Automatic deployments from GitHub
- ✅ SSL certificates
- ✅ Custom domains
- ✅ Environment variables

## Cost Estimate

- **Build minutes**: ~$0.01/minute (first 1,000 free)
- **Hosting**: ~$0.15/GB served + $0.023/GB stored
- **Typical cost**: $5-15/month for moderate traffic

## Step-by-Step Setup

### 1. Push Your Code to GitHub

Make sure your latest code is on GitHub:

```bash
git add .
git commit -m "Configure for AWS Amplify deployment"
git push
```

### 2. Create Amplify App in AWS Console

1. **Go to AWS Amplify Console**:
   - https://console.aws.amazon.com/amplify/
   - Or search for "Amplify" in AWS Console

2. **Click "New app" → "Host web app"**

3. **Connect to GitHub**:
   - Select "GitHub"
   - Click "Continue"
   - Authorize AWS Amplify to access your GitHub
   - Select repository: `DDMJOHNM/project_frontend`
   - Select branch: `main`
   - Click "Next"

4. **Configure Build Settings**:
   - **App name**: `WhatsTheScore` (or your choice)
   - **Environment name**: `production`
   - **Build spec**: The `amplify.yml` file will be auto-detected
   - Click "Advanced settings"

5. **Add Environment Variables**:
   - Click "Add environment variable"
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `sk-...` (your OpenAI API key)
   - Click "Next"

6. **Review and Deploy**:
   - Review settings
   - Click "Save and deploy"

### 3. Wait for Deployment (5-10 minutes)

Amplify will:
- ✅ Provision build environment
- ✅ Install dependencies
- ✅ Build your Next.js app
- ✅ Deploy to hosting environment
- ✅ Generate SSL certificate
- ✅ Assign Amplify domain

### 4. Get Your Amplify URL

After deployment completes, you'll get a URL like:
```
https://main.d1234567890abc.amplifyapp.com
```

**Test your app**:
- Visit the URL
- Test voice recording
- Test transcription (API route!)
- Check for any errors

### 5. Add Custom Domain

Once it's working on Amplify URL, add your custom domain:

1. **In Amplify Console**:
   - Go to your app
   - Click "Domain management" in left sidebar
   - Click "Add domain"

2. **Enter Your Domain**:
   - Domain: `duskaotearoa.co.nz`
   - Click "Configure domain"

3. **DNS Configuration**:

Amplify will show you DNS records to add. You have two options:

**Option A: Using Crazy Domains (Current DNS)**

Add these records at Crazy Domains:

```
Type: CNAME
Host: www
Value: [Amplify provides this - looks like: d1234.cloudfront.net]

Type: A (or ALIAS)
Host: @
Value: [Amplify provides this]
```

**Option B: Use Route 53 (Recommended)**

Amplify can auto-configure DNS if you use Route 53:
- Click "Use Route 53"
- It will create all DNS records automatically
- Update nameservers at Crazy Domains to Route 53

4. **Wait for SSL Certificate** (5-30 minutes):
   - Amplify automatically provisions SSL certificate
   - Certificate validates via DNS
   - Once validated, your custom domain works!

### 6. Enable Auto-Deployments

This is already enabled! Every push to `main` will:
- ✅ Trigger automatic build
- ✅ Run tests (if configured)
- ✅ Deploy to production
- ✅ No manual intervention needed

## Configuration Files

### amplify.yml

The `amplify.yml` file configures your build:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - pnpm install
    build:
      commands:
        - pnpm build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

## Environment Variables

Add these in Amplify Console → App Settings → Environment variables:

| Key | Value | Description |
|-----|-------|-------------|
| `OPENAI_API_KEY` | `sk-...` | Your OpenAI API key |
| `NODE_ENV` | `production` | (optional) Set to production |

## Monitoring & Logs

### View Build Logs:
1. Go to Amplify Console
2. Click on your app
3. Click on a deployment
4. View build logs in real-time

### View Server Logs:
1. Click "Monitoring" in left sidebar
2. View server-side function logs
3. See API route execution times

## Cleanup Old AWS Resources

Once Amplify is working, you can delete:

### 1. Delete CloudFront Distribution

```bash
# Get distribution ID
aws cloudfront list-distributions

# Disable distribution first
aws cloudfront update-distribution \
  --id E209UM3L4LHZOE \
  --distribution-config file://disable-config.json

# Wait 5 minutes, then delete
aws cloudfront delete-distribution \
  --id E209UM3L4LHZOE \
  --if-match ETAG
```

Or use Terraform:
```bash
cd terraform
# Comment out CloudFront resources in main.tf
terraform apply
```

### 2. Delete S3 Website Bucket

```bash
# Empty bucket first
aws s3 rm s3://duskaotearoa.co.nz --recursive

# Delete bucket
aws s3 rb s3://duskaotearoa.co.nz
```

### 3. Delete ACM Certificate

```bash
aws acm delete-certificate \
  --certificate-arn arn:aws:acm:us-east-1:051826704696:certificate/d11bce29-ac3d-4ec5-93b3-912f52466576 \
  --region us-east-1
```

### 4. Keep These:
- ✅ Terraform state bucket (for other infrastructure)
- ✅ DynamoDB table (for Terraform locks)
- ✅ IAM users/roles (if used elsewhere)

## Comparison: Amplify vs S3/CloudFront

| Feature | S3/CloudFront | AWS Amplify |
|---------|--------------|-------------|
| API Routes | ❌ No | ✅ Yes |
| SSR | ❌ No | ✅ Yes |
| Static Files | ✅ Yes | ✅ Yes |
| Auto Deploy | ⚠️ GitHub Actions | ✅ Built-in |
| SSL Setup | Manual | ✅ Automatic |
| Cost | ~$2-5/month | ~$5-15/month |
| Complexity | High | Low |

## Troubleshooting

### Build Fails:

**Check build logs** in Amplify Console:
- Look for errors in dependencies
- Verify environment variables are set
- Check Next.js version compatibility

### API Routes 404:

Amplify should detect Next.js automatically. If not:
- Verify `next.config.mjs` doesn't have `output: 'export'`
- Check `amplify.yml` is in root directory
- Redeploy from Amplify Console

### Custom Domain Not Working:

**DNS propagation** can take time:
- Check DNS: `dig duskaotearoa.co.nz`
- Verify DNS records match Amplify's requirements
- Wait up to 24 hours for full propagation
- Check certificate status in Amplify Console

### CORS Errors:

If calling external APIs:
- API routes run server-side (no CORS needed)
- Client-side calls may need CORS headers from API

## Cost Optimization

### Reduce Costs:
- Use caching effectively
- Optimize images (use Next.js Image component)
- Enable Amplify caching headers
- Monitor usage in Cost Explorer

### Free Tier (First 12 months):
- 1,000 build minutes/month
- 15 GB data transfer/month
- 5 GB storage/month

## Next Steps

1. ✅ Commit and push changes
2. ✅ Create Amplify app in console
3. ✅ Connect GitHub repository
4. ✅ Add environment variables
5. ✅ Deploy and test
6. ✅ Add custom domain
7. ✅ Clean up old S3/CloudFront resources

Your app will auto-deploy on every push to `main`! 🚀

