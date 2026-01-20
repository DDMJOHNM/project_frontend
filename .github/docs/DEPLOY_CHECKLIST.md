# Deployment Checklist for duskaotearoa.co.nz

## Current Status
- ✅ Terraform infrastructure created
- ✅ CloudFront Distribution: E209UM3L4LHZOE
- ✅ CloudFront Domain: d25wety08wrwk0.cloudfront.net
- ✅ S3 Bucket: duskaotearoa.co.nz
- ✅ SSL Certificate validated
- ✅ Next.js app built successfully

## What's Missing

### 1. DNS Configuration ⚠️ CRITICAL
Your domain `duskaotearoa.co.nz` needs to point to CloudFront.

**Go to Crazy Domains (or your DNS provider):**
1. Log in to your DNS management
2. Add or modify the DNS record:
   - **Type**: `CNAME` or `A` (Alias)
   - **Host/Name**: `@` or leave blank (for root domain)
   - **Value/Points to**: `d25wety08wrwk0.cloudfront.net`
   - **TTL**: 300 seconds (5 minutes)

3. Save the record
4. Wait 5-15 minutes for DNS propagation

**To verify DNS is working:**
```bash
dig duskaotearoa.co.nz
# or
nslookup duskaotearoa.co.nz
```

### 2. Deploy to S3

**Option A: Deploy via GitHub Actions (Recommended)**

1. Make sure these GitHub Secrets are configured:
   - Go to: https://github.com/DDMJOHNM/project_frontend/settings/secrets/actions
   - Verify these secrets exist:
     - `AWS_ACCESS_KEY_ID` - IAM user access key
     - `AWS_SECRET_ACCESS_KEY` - IAM user secret key
     - `AWS_CLOUDFRONT_DISTRIBUTION_ID` - E209UM3L4LHZOE
     - `OPENAI_API_KEY` - Your OpenAI API key

2. Push any change to main branch or manually trigger the workflow
3. Check the Actions tab to see deployment progress

**Option B: Deploy Manually**

First, refresh your AWS credentials:
```bash
# If using AWS SSO:
aws sso login --profile your-profile

# Then set credentials:
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_SESSION_TOKEN="your-token"  # if using temporary creds
```

Then deploy:
```bash
cd /Users/johnmason/dev/WhatsTheScore
pnpm build
aws s3 sync ./out s3://duskaotearoa.co.nz --delete --exact-timestamps
aws cloudfront create-invalidation --distribution-id E209UM3L4LHZOE --paths "/*"
```

### 3. Important Note About API Routes ⚠️

Your Next.js app uses `output: 'export'` for static hosting on S3. This means:

- ❌ API routes (`/api/*`) **will NOT work** in the static export
- ✅ Client-side pages work fine

**To fix API functionality:**

You have 2 options:

**Option 1: Use Your Backend** (Recommended)
- Your frontend should call your backend API directly
- Backend: https://github.com/DDMJOHNM/johns_ai_project_backend
- Update API calls to use your backend URL instead of `/api/...`

**Option 2: Use AWS Lambda@Edge or CloudFront Functions**
- Deploy API routes as Lambda functions
- Requires additional AWS configuration

## Testing Deployment

Once DNS is configured and files are deployed:

1. Visit: https://duskaotearoa.co.nz
2. Check browser console for errors
3. Test the login functionality
4. Verify voice agent works

## Troubleshooting

### Site not loading:
- Check DNS propagation: `dig duskaotearoa.co.nz`
- Check CloudFront status in AWS Console
- Clear browser cache
- Try: https://d25wety08wrwk0.cloudfront.net (direct CloudFront URL)

### CloudFront shows "Access Denied":
- Check S3 bucket has files: `aws s3 ls s3://duskaotearoa.co.nz/`
- Verify bucket policy allows CloudFront access
- Check CloudFront Origin Access Control is configured

### API calls fail:
- Remember: `/api/*` routes don't work in static export
- Update code to call your backend directly
- Check backend CORS configuration

## Next Steps After Deployment

1. Monitor CloudFront metrics in AWS Console
2. Set up CloudWatch alarms for errors
3. Configure custom error pages in CloudFront
4. Update frontend API calls to use backend URL
5. Test all functionality end-to-end

