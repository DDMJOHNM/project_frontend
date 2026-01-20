# Fixing Terraform Certificate and State Issues

## Current Issues

1. **SSL Certificate**: Certificate created but not validated (needs DNS records)
2. **State Bucket**: Already exists (from bootstrap script)
3. **DynamoDB Table**: Already exists (from bootstrap script)

## Step 1: Import Existing State Resources

Since the state bucket and DynamoDB table already exist, import them into Terraform:

```bash
cd terraform

# Import the S3 bucket
terraform import aws_s3_bucket.terraform_state duskaotearoa-terraform-state

# Import the DynamoDB table
terraform import aws_dynamodb_table.terraform_state_lock terraform-state-lock
```

If you get errors about dependent resources, import those too:

```bash
# Import bucket versioning
terraform import aws_s3_bucket_versioning.terraform_state duskaotearoa-terraform-state

# Import bucket encryption
terraform import aws_s3_bucket_server_side_encryption_configuration.terraform_state duskaotearoa-terraform-state

# Import bucket public access block
terraform import aws_s3_bucket_public_access_block.terraform_state duskaotearoa-terraform-state
```

## Step 2: Get DNS Validation Records

Get the DNS validation records needed for the SSL certificate:

```bash
cd terraform
terraform output certificate_validation_records
```

This will show something like:
```json
[
  {
    "domain": "duskaotearoa.co.nz",
    "name": "_abc123.duskaotearoa.co.nz",
    "type": "CNAME",
    "value": "_xyz789.acm-validations.aws."
  }
]
```

## Step 3: Add DNS Records

Add the CNAME record to your DNS provider:

1. **Go to your DNS provider** (where you manage `duskaotearoa.co.nz`)
2. **Add a CNAME record**:
   - **Name**: `_abc123` (from the output above, without the domain)
   - **Type**: `CNAME`
   - **Value**: `_xyz789.acm-validations.aws.` (from the output above)
   - **TTL**: `300` (or default)

**Example for common DNS providers:**

- **Cloudflare**: DNS → Records → Add CNAME
- **Route 53**: Hosted Zone → Create Record → CNAME
- **Namecheap**: Advanced DNS → Add New Record → CNAME

## Step 4: Wait for Validation

Wait for AWS to validate the certificate (usually 5-10 minutes):

```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn $(terraform output -raw certificate_arn) \
  --region us-east-1 \
  --query 'Certificate.Status'
```

When it shows `ISSUED`, the certificate is ready.

## Step 5: Apply Terraform Again

Once the certificate is validated, run:

```bash
cd terraform
terraform apply
```

The CloudFront distribution should now create successfully.

## Alternative: Skip Certificate Validation (Temporary)

If you want to deploy without waiting for certificate validation, you can temporarily use CloudFront's default certificate:

1. **Comment out the certificate validation** in `main.tf`:
   ```hcl
   # resource "aws_acm_certificate_validation" "website" {
   #   ...
   # }
   ```

2. **Update CloudFront to use default certificate**:
   ```hcl
   viewer_certificate {
     cloudfront_default_certificate = true
   }
   ```

3. **Apply and deploy** (will use `*.cloudfront.net` domain)

4. **Later, add certificate validation** and switch back to custom domain

## Troubleshooting

### Certificate Still Not Validating

- Check DNS propagation: `dig _abc123.duskaotearoa.co.nz CNAME`
- Verify the CNAME record is correct
- Wait up to 30 minutes for DNS propagation
- Check certificate status in AWS Console: ACM → Certificates

### Import Errors

If import fails, you can:
1. **Remove the resources from Terraform** (comment them out)
2. **Or destroy and recreate** (only if you don't have important state):
   ```bash
   terraform destroy -target=aws_s3_bucket.terraform_state
   terraform destroy -target=aws_dynamodb_table.terraform_state_lock
   terraform apply
   ```

### CloudFront Still Failing

- Ensure certificate is in `ISSUED` status
- Verify certificate ARN is correct
- Check that certificate is in `us-east-1` region (required for CloudFront)

