# AWS Services Cleanup After Amplify Migration

## ✅ Safe to DELETE (After Amplify is Working)

### 1. CloudFront Distribution
**ID**: `E209UM3L4LHZOE`  
**Reason**: Amplify creates its own CloudFront distribution automatically

**How to Delete**:
```bash
# Via AWS Console:
# 1. Go to CloudFront Console
# 2. Select distribution E209UM3L4LHZOE
# 3. Click "Disable" (wait 5-10 minutes)
# 4. Click "Delete"

# Or via CLI (after disabling):
aws cloudfront delete-distribution \
  --id E209UM3L4LHZOE \
  --if-match $(aws cloudfront get-distribution --id E209UM3L4LHZOE --query 'ETag' --output text)
```

**Savings**: ~$1-5/month (depends on traffic)

---

### 2. S3 Bucket for Website Hosting
**Name**: `duskaotearoa.co.nz`  
**Reason**: Amplify hosts your application files

**How to Delete**:
```bash
# Empty the bucket first
aws s3 rm s3://duskaotearoa.co.nz --recursive

# Then delete bucket
aws s3 rb s3://duskaotearoa.co.nz

# Or via console:
# 1. Go to S3 Console
# 2. Select bucket "duskaotearoa.co.nz"
# 3. Click "Empty" then "Delete"
```

**Savings**: ~$0.50-2/month

---

### 3. ACM SSL Certificate
**ARN**: `arn:aws:acm:us-east-1:051826704696:certificate/d11bce29-ac3d-4ec5-93b3-912f52466576`  
**Reason**: Amplify creates its own SSL certificate for your domain

**How to Delete**:
```bash
aws acm delete-certificate \
  --certificate-arn arn:aws:acm:us-east-1:051826704696:certificate/d11bce29-ac3d-4ec5-93b3-912f52466576 \
  --region us-east-1

# Or via console:
# 1. Go to AWS Certificate Manager (us-east-1 region)
# 2. Select the certificate
# 3. Click "Delete"
```

**Savings**: $0 (ACM is free, but one less thing to manage)

---

### 4. CloudFront Origin Access Control
**ID**: `E20EQ3VGNY7H07`  
**Reason**: No longer needed without CloudFront distribution

Will be deleted automatically when you delete the CloudFront distribution.

---

### 5. S3 Bucket Policy (for website bucket)
**Reason**: Deleted automatically when bucket is deleted

---

### 6. Terraform Frontend Resources

You can simplify your `terraform/main.tf` by removing:

```hcl
# REMOVE THESE RESOURCES:
- aws_cloudfront_distribution.website
- aws_cloudfront_origin_access_control.website
- aws_acm_certificate.website
- aws_acm_certificate_validation.website
- aws_s3_bucket.website
- aws_s3_bucket_versioning.website
- aws_s3_bucket_public_access_block.website
- aws_s3_bucket_server_side_encryption_configuration.website
- aws_s3_bucket_policy.website
- data.aws_iam_policy_document.s3_policy
```

**How to Clean Up with Terraform**:

```bash
cd terraform

# Option 1: Comment out resources and apply
# 1. Edit main.tf - comment out all resources listed above
# 2. Run:
terraform apply

# Option 2: Destroy specific resources
terraform destroy \
  -target=aws_cloudfront_distribution.website \
  -target=aws_s3_bucket.website \
  -target=aws_acm_certificate.website
```

---

## 🔒 KEEP These AWS Services

### 1. Terraform State Backend
**S3 Bucket**: `duskaotearoa-terraform-state`  
**DynamoDB Table**: `terraform-state-lock`  
**Reason**: Needed if you have any other Terraform-managed infrastructure

**Keep if**:
- You might use Terraform for other AWS resources
- You want to keep infrastructure history

**Delete only if**:
- You're completely done with Terraform
- You've exported any important state information

---

### 2. IAM User: github-actions-deploy-front-user
**Reason**: May still be useful for other deployments

**Keep if**:
- You might use GitHub Actions for other purposes
- You have other AWS automation

**Delete if**:
- Only used for S3/CloudFront deployment
- Not needed for Amplify (Amplify uses its own service role)

**How to Delete** (if not needed):
```bash
# Remove access keys first
aws iam list-access-keys --user-name github-actions-deploy-front-user
aws iam delete-access-key --user-name github-actions-deploy-front-user --access-key-id AKIA...

# Delete user
aws iam delete-user --user-name github-actions-deploy-front-user
```

---

### 3. AWS Secrets Manager (Optional)
**Secret**: `whatsthescore/openai-api-key`  
**Reason**: Your OpenAI API key

**Keep if**:
- You have other services using this secret
- You want centralized secret management

**Delete if**:
- Only used by frontend
- You're storing OPENAI_API_KEY in Amplify environment variables instead

**Cost**: ~$0.40/month per secret

**How to Delete** (if not needed):
```bash
aws secretsmanager delete-secret \
  --secret-id whatsthescore/openai-api-key \
  --force-delete-without-recovery \
  --region us-east-1
```

---

## 📊 Summary Table

| Service | Action | Reason | Savings |
|---------|--------|--------|---------|
| CloudFront Distribution | ✅ DELETE | Amplify has its own CDN | ~$1-5/mo |
| S3 Website Bucket | ✅ DELETE | Amplify hosts files | ~$0.50-2/mo |
| ACM Certificate | ✅ DELETE | Amplify provides SSL | $0 |
| Origin Access Control | ✅ DELETE | Not needed | $0 |
| Terraform State (S3+DDB) | 🔒 KEEP | For infrastructure mgmt | - |
| IAM User (GitHub Actions) | ⚠️ OPTIONAL | Only if not used elsewhere | $0 |
| Secrets Manager | ⚠️ OPTIONAL | Use Amplify env vars instead | ~$0.40/mo |

---

## 🎯 Recommended Cleanup Order

### Step 1: Deploy and Test Amplify
✅ Make sure Amplify deployment is fully working  
✅ Test all features (API routes, voice agent, login)  
✅ Verify custom domain is working on Amplify

### Step 2: Update DNS
✅ Point `duskaotearoa.co.nz` to Amplify  
✅ Verify site loads from your domain  
✅ Test for 24 hours to ensure stability

### Step 3: Delete CloudFront Distribution
```bash
# Disable first
aws cloudfront get-distribution-config --id E209UM3L4LHZOE > config.json
# Edit config.json, set Enabled: false
aws cloudfront update-distribution --id E209UM3L4LHZOE --if-match ETAG --distribution-config file://config.json

# Wait 5-10 minutes, then delete
aws cloudfront delete-distribution --id E209UM3L4LHZOE --if-match ETAG
```

### Step 4: Delete S3 Website Bucket
```bash
aws s3 rm s3://duskaotearoa.co.nz --recursive
aws s3 rb s3://duskaotearoa.co.nz
```

### Step 5: Delete ACM Certificate
```bash
aws acm delete-certificate \
  --certificate-arn arn:aws:acm:us-east-1:051826704696:certificate/d11bce29-ac3d-4ec5-93b3-912f52466576 \
  --region us-east-1
```

### Step 6: Clean Up Terraform
```bash
cd terraform
# Edit main.tf - remove frontend resources
terraform apply
```

### Step 7: (Optional) Clean Up IAM and Secrets
Only if not needed elsewhere.

---

## 💰 Total Potential Savings

**Before (S3/CloudFront setup)**:
- S3: $0.50/mo
- CloudFront: $1-5/mo
- Secrets Manager: $0.40/mo
- **Total: ~$2-6/month**

**After Cleanup (Amplify only)**:
- Amplify: $5-15/mo
- Terraform state: $1/mo
- **Total: ~$6-16/month**

**Net Change**: +$4-10/month, but you get:
- ✅ Working API routes
- ✅ Auto-deployments
- ✅ No credential management
- ✅ Better developer experience

---

## ⚠️ Important Notes

1. **Backup First**: Export any important configurations before deleting
2. **DNS Change**: Update DNS records to point to Amplify before deleting CloudFront
3. **Test Thoroughly**: Make sure everything works on Amplify before cleanup
4. **Terraform State**: Keep terraform state backend if you might use it later
5. **Gradual Cleanup**: Delete resources one at a time, verify nothing breaks

---

## 🆘 If Something Goes Wrong

If you need to rollback to S3/CloudFront:

1. **Revert next.config.mjs**:
   ```javascript
   output: 'export',
   ```

2. **Rebuild and deploy**:
   ```bash
   pnpm build
   aws s3 sync ./out s3://duskaotearoa.co.nz
   ```

3. **Update DNS back to CloudFront**

(But Amplify should work better, so this shouldn't be needed!)

---

## Questions Before Cleanup?

- Is Amplify working perfectly?
- Is your custom domain configured?
- Have you tested for 24-48 hours?
- Have you backed up any important configs?

If YES to all, proceed with cleanup! If NO, wait until stable.

