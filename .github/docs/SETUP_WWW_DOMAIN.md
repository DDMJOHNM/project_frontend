# Setup WWW Domain for duskaotearoa.co.nz

## What I Just Did ✅
Updated your Terraform configuration to support both:
- `duskaotearoa.co.nz` (root domain)
- `www.duskaotearoa.co.nz` (www subdomain)

## What You Need to Do Now

### Step 1: Refresh AWS Credentials

```bash
# Option A: If using AWS SSO
aws sso login

# Option B: Export new credentials
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_SESSION_TOKEN="your-token"
```

### Step 2: Apply Terraform Changes

```bash
cd /Users/johnmason/dev/WhatsTheScore/terraform
terraform plan   # Review the changes
terraform apply  # Apply the changes (type 'yes' when prompted)
```

This will:
- Update your SSL certificate to include www.duskaotearoa.co.nz
- Update CloudFront to accept both domains
- Generate a NEW DNS validation record for www

### Step 3: Get the New DNS Validation Record

After `terraform apply` completes, run:

```bash
terraform output certificate_validation_records
```

You'll see TWO validation records:
1. One for `duskaotearoa.co.nz` (already added ✅)
2. **ONE NEW for `www.duskaotearoa.co.nz`** (you need to add this!)

### Step 4: Add DNS Records at Crazy Domains

You need to add **TWO** DNS records:

#### Record 1: WWW Validation (NEW - for SSL)
- **Type**: CNAME
- **Hostname**: `_something.www.duskaotearoa.co.nz` (from terraform output)
- **Points to**: `_something.acm-validations.aws.` (from terraform output)

#### Record 2: WWW to CloudFront (NEW - for your site)
- **Type**: CNAME
- **Hostname**: `www` or `www.duskaotearoa.co.nz`
- **Points to**: `d25wety08wrwk0.cloudfront.net` (WITHOUT your domain appended!)

**IMPORTANT**: Make sure the CloudFront CNAME doesn't have `.duskaotearoa.co.nz` appended to it!

### Step 5: Wait for SSL Certificate Validation

```bash
# Check certificate status (run this every few minutes)
aws acm describe-certificate \
  --certificate-arn $(cd terraform && terraform output -raw certificate_arn) \
  --region us-east-1 \
  --query 'Certificate.Status'
```

Wait until it shows `"ISSUED"` (can take 5-30 minutes after adding DNS records)

### Step 6: Deploy Your Site to S3

Once the certificate is issued:

```bash
cd /Users/johnmason/dev/WhatsTheScore
./deploy-manual.sh
```

Or manually:
```bash
pnpm build
aws s3 sync ./out s3://duskaotearoa.co.nz --delete --exact-timestamps
aws cloudfront create-invalidation --distribution-id E209UM3L4LHZOE --paths "/*"
```

### Step 7: Test Your Site

After 5-10 minutes:
- ✅ https://www.duskaotearoa.co.nz (should work!)
- ✅ https://d25wety08wrwk0.cloudfront.net (CloudFront direct URL)
- ⚠️ https://duskaotearoa.co.nz (might not work if root domain CNAME is still broken)

## Troubleshooting

### If WWW CNAME still has domain appended:
Try these in the Crazy Domains interface:
1. Enter: `d25wety08wrwk0.cloudfront.net.` (with trailing dot)
2. Look for "FQDN" checkbox
3. Look for dropdown saying "external domain" vs "this domain"
4. Contact Crazy Domains support

### If you want ONLY www to work (and skip root domain):
That's fine! Just use `www.duskaotearoa.co.nz` as your primary URL. You can redirect the root domain to www later.

### Check DNS propagation:
```bash
dig www.duskaotearoa.co.nz
# Should show CNAME to d25wety08wrwk0.cloudfront.net
```

## Alternative: Use Route 53 for DNS

If Crazy Domains keeps appending the domain name, you can migrate DNS to AWS Route 53:

```bash
# Create hosted zone
aws route53 create-hosted-zone --name duskaotearoa.co.nz --caller-reference $(date +%s)

# Then update nameservers at Crazy Domains to the Route 53 nameservers
```

Route 53 handles CNAME records correctly and works perfectly with CloudFront.

## Summary

**You're 90% there!** Just need to:
1. ✅ Refresh AWS credentials
2. ✅ Apply Terraform changes
3. ✅ Add the new www validation DNS record
4. ✅ Add www CNAME to CloudFront
5. ✅ Deploy your site files to S3
6. 🎉 Your site is live at www.duskaotearoa.co.nz!

