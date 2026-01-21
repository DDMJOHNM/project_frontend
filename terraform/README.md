# Terraform Infrastructure - DEPRECATED FOR FRONTEND

⚠️ **Important**: This Terraform configuration is **no longer used** for frontend deployment.

## Current Status

**Frontend Infrastructure**: Managed by **AWS Amplify** (not Terraform)  
**Custom Domain**: Configured in **Amplify Console** (not via Terraform/DNS)  
**Terraform Resources**: All S3/CloudFront/ACM resources **disabled** in `main.tf`

---

## ✅ What's Now Using Amplify

The following infrastructure is managed by AWS Amplify:

| Resource | Old (Terraform) | New (Amplify) |
|----------|-----------------|---------------|
| **Hosting** | S3 bucket `duskaotearoa.co.nz` | Amplify hosting ✅ |
| **CDN** | CloudFront distribution | Amplify CDN ✅ |
| **SSL Certificate** | ACM certificate | Amplify SSL ✅ |
| **Custom Domain** | Manual DNS/CloudFront | Amplify domain management ✅ |
| **Deployments** | GitHub Actions + Terraform | Amplify auto-deploy ✅ |
| **API Routes** | Not supported | Lambda@Edge ✅ |

---

## 🔧 Setting Up Custom Domain in Amplify

Since the domain is now managed by Amplify, follow these steps:

### 1. Open Amplify Console

Go to: [AWS Amplify Console](https://console.aws.amazon.com/amplify/)

### 2. Select Your App

Click on your app (e.g., `WhatsTheScore` or your repo name)

### 3. Add Custom Domain

1. Click **"Domain management"** in the left sidebar
2. Click **"Add domain"**
3. Enter your domain: `duskaotearoa.co.nz`
4. Click **"Configure domain"**

### 4. Configure DNS

Amplify will provide DNS records to add. You have two options:

#### Option A: Using Existing DNS Provider (Crazy Domains, etc.)

Add these records at your DNS provider:

```
Type: CNAME
Host: www
Value: [Amplify provides this - something like: xxxxx.cloudfront.net]

Type: A (or ALIAS)
Host: @ (or leave blank for root domain)
Value: [Amplify provides this]
```

#### Option B: Use Route 53 (Recommended)

Let Amplify manage DNS automatically:
1. Click **"Use Route 53"** in Amplify Console
2. Amplify creates a hosted zone and all DNS records
3. Update nameservers at your registrar (Crazy Domains) to Route 53 nameservers
4. Wait for propagation (1-48 hours, usually 2-6 hours)

### 5. Wait for SSL Certificate

Amplify automatically:
- Provisions SSL certificate
- Validates via DNS
- Enables HTTPS

**Time**: 5-30 minutes after DNS records are added

### 6. Verify Domain

Once complete, your app will be accessible at:
- `https://duskaotearoa.co.nz`
- `https://www.duskaotearoa.co.nz` (if configured)

---

## 📂 What's Still in This Directory

### Active Resources

**Terraform State Backend** (still exists):
- S3 bucket: `duskaotearoa-terraform-state`
- DynamoDB table: `terraform-state-lock`

**Purpose**: Stores Terraform state for historical purposes or if you need to manage other AWS resources via Terraform in the future.

### Disabled Resources (in `main.tf`)

All frontend resources are commented out:
- ❌ S3 bucket for website hosting
- ❌ CloudFront distribution
- ❌ ACM certificate
- ❌ Origin Access Control
- ❌ S3 bucket policies

**Note**: All resources have "DISABLED (Using AWS Amplify instead)" comments.

---

## 🗑️ Optional Cleanup

If you want to remove the old resources that were created by Terraform before switching to Amplify:

### Manual Cleanup (AWS Console)

**1. Delete CloudFront Distribution** (if exists):
```
AWS Console → CloudFront → Distribution E209UM3L4LHZOE
→ Disable → Wait 5-10 mins → Delete
```

**2. Delete S3 Bucket** (if exists):
```
AWS Console → S3 → duskaotearoa.co.nz
→ Empty bucket → Delete bucket
```

**3. Delete ACM Certificate** (if exists):
```
AWS Console → Certificate Manager → us-east-1 region
→ Select certificate → Delete
```

### Keep These Resources

- ✅ Terraform state bucket: `duskaotearoa-terraform-state`
- ✅ DynamoDB table: `terraform-state-lock`

**Why?** You might need these for other Terraform-managed infrastructure.

---

## 🚀 If You Need to Use Terraform Again

If you want to manage other AWS resources (not frontend) with Terraform:

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Create New Resources

Add new resources to `main.tf` or create new `.tf` files for:
- Backend infrastructure (if not using Amplify)
- Databases (RDS, DynamoDB)
- Other AWS services
- Monitoring/logging resources

### 3. Apply Changes

```bash
terraform plan
terraform apply
```

**Note**: Frontend resources remain disabled. Don't uncomment them - use Amplify instead.

---

## 📋 Terraform State Backend

If you need to configure Terraform state backend for other resources:

### Bootstrap Script

```bash
./terraform/bootstrap-state.sh
```

This creates (if they don't exist):
- S3 bucket: `duskaotearoa-terraform-state`
- DynamoDB table: `terraform-state-lock`

### Manual Configuration

Already configured in `backend.tf`:
```hcl
terraform {
  backend "s3" {
    bucket         = "duskaotearoa-terraform-state"
    key            = "duskaotearoa.co.nz/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

---

## ❓ FAQ

### Why not use Terraform for frontend?

**Reasons for switching to Amplify**:
- ✅ Native support for Next.js API routes
- ✅ Automatic deployments from GitHub
- ✅ Simpler configuration
- ✅ Built-in SSL certificate management
- ✅ No manual DNS configuration needed
- ✅ Better integration with serverless functions
- ✅ No need to manage S3/CloudFront manually

### Can I switch back to Terraform?

Yes, but **not recommended**:
- Next.js API routes won't work with static S3 hosting
- You'd need to set up Lambda@Edge or API Gateway separately
- More complex deployment pipeline
- Manual certificate and DNS management

### What if I want to manage DNS with Terraform?

You can use Terraform for Route 53 DNS separately:
1. Create a new `.tf` file for Route 53 resources
2. Point DNS to your Amplify distribution
3. Keep frontend hosting in Amplify

---

## 📞 Support

**For frontend deployment issues**: Check the main [README.md](../README.md)  
**For Amplify setup**: See [AWS Amplify Console](https://console.aws.amazon.com/amplify/)  
**For DNS issues**: Check your domain registrar or use Route 53

---

## Summary

- 🚫 **Don't use this Terraform config** for frontend deployment
- ✅ **Use AWS Amplify** for frontend infrastructure
- ✅ **Configure custom domain** in Amplify Console
- 📂 **Keep Terraform state backend** for potential future use
- 🗑️ **Optional**: Clean up old S3/CloudFront resources

**For deployment instructions, see the main [README.md](../README.md)**
