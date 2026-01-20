# Deployment Setup Guide for duskaotearoa.co.nz

This guide will help you set up HTTPS deployment to `duskaotearoa.co.nz` using GitHub Actions and AWS.

## Overview

- **S3 Bucket**: `duskaotearoa.co.nz` (stores your static files)
- **CloudFront**: Provides HTTPS and CDN
- **IAM User**: `github-actions-deploy-front-user` (for GitHub Actions)
- **Domain**: `duskaotearoa.co.nz`

## Step 1: Create IAM User and Access Keys

1. Go to AWS Console → IAM → Users
2. Create user: `github-actions-deploy-front-user`
3. Attach the policy from `terraform/README.md` (or use the permissions listed below)
4. Create access keys (Access key ID and Secret access key)
5. **Save these credentials** - you'll add them to GitHub secrets

### Minimum IAM Permissions

Your IAM user needs:
- S3 permissions for `duskaotearoa.co.nz` bucket
- CloudFront permissions (for cache invalidation)
- Basic STS permissions

## Step 2: Set Up Infrastructure with Terraform

1. **Navigate to terraform directory**:
   ```bash
   cd terraform
   ```

2. **Initialize Terraform**:
   ```bash
   terraform init
   ```

3. **Review the plan**:
   ```bash
   terraform plan
   ```

4. **Apply the configuration**:
   ```bash
   terraform apply
   ```

5. **Save the outputs**:
   - Note the `cloudfront_distribution_id` - you'll need this for GitHub secrets
   - Note the `certificate_validation_records` - add these DNS records to validate the SSL certificate

## Step 3: Validate SSL Certificate

1. After running `terraform apply`, you'll get DNS validation records
2. Go to your DNS provider (where `duskaotearoa.co.nz` is managed)
3. Add the CNAME records provided by Terraform
4. Wait 5-30 minutes for validation to complete
5. Check status: AWS Console → Certificate Manager → Your certificate

## Step 4: Configure DNS

Once the certificate is validated:

1. **Get CloudFront domain name** from Terraform output
2. **Add DNS record**:
   - Type: `CNAME` or `A` (Alias if using Route 53)
   - Name: `duskaotearoa.co.nz` (or `@` depending on your DNS provider)
   - Value: CloudFront domain name (e.g., `d1234567890abc.cloudfront.net`)

## Step 5: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

- **`AWS_ACCESS_KEY_ID`**: Access key for `github-actions-deploy-front-user`
- **`AWS_SECRET_ACCESS_KEY`**: Secret key for `github-actions-deploy-front-user`
- **`AWS_S3_BUCKET`**: `duskaotearoa.co.nz` (optional, hardcoded in workflow)
- **`AWS_REGION`**: `us-east-1` (or your preferred region)
- **`AWS_CLOUDFRONT_DISTRIBUTION_ID`**: From Terraform output
- **`OPENAI_API_KEY`**: Your OpenAI API key (starts with `sk-...`) - See `.github/OPENAI_SECRET_SETUP.md` for details

## Step 6: Configure Backend Connection

Your frontend connects to the backend at: [https://github.com/DDMJOHNM/johns_ai_project_backend](https://github.com/DDMJOHNM/johns_ai_project_backend)

### Get Your Backend URL

From your backend deployment, get the URL:
- **EC2 + ALB**: `http://johns-ai-backend-ec2-alb-XXXXXX.us-east-1.elb.amazonaws.com`
- **API Gateway**: `https://XXXXXX.execute-api.us-east-1.amazonaws.com/prod`

### Configure Backend URL

1. **For GitHub Actions (Production)**:
   - Add GitHub Secret: `BACKEND_URL`
   - Value: Your backend API URL (ALB DNS or API Gateway URL)

2. **For Local Development**:
   - Create `.env.local` file:
     ```env
     NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
     # Or your deployed backend URL
     ```

3. **The login route** (`app/api/login/route.ts`) is already configured to use:
   - `NEXT_PUBLIC_BACKEND_URL` (client-side accessible)
   - Falls back to `BACKEND_URL` (server-side only)

### Backend HTTPS Configuration

To ensure your frontend can hit your backend via HTTPS:

1. **If using EC2 + ALB**:
   - Add SSL certificate to ALB
   - Update ALB listener to HTTPS (port 443)
   - Update backend URL to use `https://`

2. **If using API Gateway**:
   - API Gateway already provides HTTPS
   - Use the HTTPS API Gateway URL

3. **Configure CORS** on your backend to allow:
   - Origin: `https://duskaotearoa.co.nz`
   - Methods: GET, POST, PUT, DELETE, OPTIONS
   - Headers: Content-Type, Authorization, etc.

## Step 7: Test Deployment

1. **Push to main branch** or manually trigger workflow
2. **Check GitHub Actions** tab for deployment status
3. **Visit** `https://duskaotearoa.co.nz` to verify
4. **Test API calls** to ensure backend connectivity

## Troubleshooting

### Certificate Not Validating
- Check DNS records are correct
- Wait up to 30 minutes
- Verify records in Certificate Manager

### CloudFront Not Updating
- Check CloudFront distribution status
- Verify cache invalidation in GitHub Actions logs
- Clear browser cache

### Backend Connection Issues
- Verify backend CORS configuration
- Check backend is accessible via HTTPS
- Review browser console for CORS errors

### S3 Upload Fails
- Verify IAM user has correct permissions
- Check bucket name matches exactly
- Verify AWS credentials in GitHub secrets

## Security Notes

- ✅ S3 bucket is private (only CloudFront can access)
- ✅ HTTPS enforced via CloudFront
- ✅ Origin Access Control configured
- ✅ SSL certificate via ACM
- ✅ IAM user with least privilege

## Next Steps

After successful deployment:
1. Monitor CloudFront metrics
2. Set up CloudWatch alarms if needed
3. Configure custom error pages
4. Set up monitoring/analytics

