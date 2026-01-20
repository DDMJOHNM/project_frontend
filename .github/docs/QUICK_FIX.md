# Quick Fix for Current Terraform Errors

You have three errors. Here's how to fix them quickly:

## Option 1: Import Existing Resources (Recommended)

Import the state bucket and DynamoDB table that already exist:

```bash
cd terraform

# Import state bucket and its configurations
terraform import aws_s3_bucket.terraform_state duskaotearoa-terraform-state
terraform import aws_s3_bucket_versioning.terraform_state duskaotearoa-terraform-state
terraform import aws_s3_bucket_server_side_encryption_configuration.terraform_state duskaotearoa-terraform-state
terraform import aws_s3_bucket_public_access_block.terraform_state duskaotearoa-terraform-state

# Import DynamoDB table
terraform import aws_dynamodb_table.terraform_state_lock terraform-state-lock
```

## Option 2: Remove State Resources from Terraform (Easier)

If you don't want Terraform to manage the state bucket/table, comment them out:

1. **Edit `terraform/state-bucket.tf`** and comment out all resources (lines 8-71)
2. **Or delete/rename the file**: `mv state-bucket.tf state-bucket.tf.disabled`

## Fix Certificate Validation

The certificate validation is timing out because DNS records haven't been added yet.

### Step 1: Get DNS Validation Records

```bash
cd terraform
terraform output certificate_validation_records
```

### Step 2: Add DNS Record

Add the CNAME record to your DNS provider (where you manage `duskaotearoa.co.nz`).

### Step 3: Wait for Validation

Wait 5-10 minutes, then check status:

```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:051826704696:certificate/d11bce29-ac3d-4ec5-93b3-912f52466576 \
  --region us-east-1 \
  --query 'Certificate.Status'
```

When it shows `ISSUED`, run `terraform apply` again.

## Option 3: Deploy Without Custom Domain (Temporary)

If you want to deploy immediately without waiting for certificate validation:

1. **Comment out certificate validation** in `main.tf`:
   ```hcl
   # resource "aws_acm_certificate_validation" "website" {
   #   provider        = aws.us_east_1
   #   certificate_arn = aws_acm_certificate.website.arn
   #   timeouts {
   #     create = "30m"
   #   }
   # }
   ```

2. **Update CloudFront to use certificate directly** (remove validation dependency):
   ```hcl
   viewer_certificate {
     acm_certificate_arn      = aws_acm_certificate.website.arn
     ssl_support_method       = "sni-only"
     minimum_protocol_version = "TLSv1.2_2021"
   }
   ```

3. **Remove aliases temporarily**:
   ```hcl
   # aliases = [var.domain_name]  # Comment this out
   ```

4. **Apply and deploy** (will use CloudFront's default domain like `d1234567890.cloudfront.net`)

5. **Later, add DNS records, wait for validation, then uncomment and apply again**

## Recommended: Quick Fix Steps

```bash
cd terraform

# 1. Import existing resources
terraform import aws_s3_bucket.terraform_state duskaotearoa-terraform-state
terraform import aws_s3_bucket_versioning.terraform_state duskaotearoa-terraform-state
terraform import aws_s3_bucket_server_side_encryption_configuration.terraform_state duskaotearoa-terraform-state
terraform import aws_s3_bucket_public_access_block.terraform_state duskaotearoa-terraform-state
terraform import aws_dynamodb_table.terraform_state_lock terraform-state-lock

# 2. Get DNS validation records
terraform output certificate_validation_records

# 3. Add DNS record to your DNS provider

# 4. Wait 10 minutes, then apply
terraform apply
```

