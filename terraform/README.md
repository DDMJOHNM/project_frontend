# Terraform Infrastructure Setup for duskaotearoa.co.nz

This Terraform configuration creates:
- S3 bucket: `duskaotearoa.co.nz`
- CloudFront distribution for HTTPS
- SSL certificate via ACM
- Proper security configurations

## Prerequisites

1. AWS CLI configured
2. Terraform installed (>= 1.0)
3. IAM user `github-actions-deploy-front-user` with appropriate permissions

## State Backend Setup (S3)

Terraform state is configured to be stored in S3. **Before first use**, create the state bucket:

### Quick Setup

```bash
# Run the bootstrap script
./terraform/bootstrap-state.sh
```

Or manually create:
- S3 bucket: `duskaotearoa-terraform-state`
- DynamoDB table: `terraform-state-lock`

See `SETUP_STATE_BACKEND.md` for detailed instructions.

## Required IAM Permissions

Your IAM user `github-actions-deploy-front-user` needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:PutBucketPolicy",
        "s3:GetBucketPolicy"
      ],
      "Resource": [
        "arn:aws:s3:::duskaotearoa.co.nz",
        "arn:aws:s3:::duskaotearoa.co.nz/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateDistribution",
        "cloudfront:GetDistribution",
        "cloudfront:UpdateDistribution",
        "cloudfront:DeleteDistribution",
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations",
        "cloudfront:ListDistributions"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "acm:RequestCertificate",
        "acm:DescribeCertificate",
        "acm:ListCertificates",
        "acm:DeleteCertificate"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:GetHostedZone",
        "route53:ListHostedZones",
        "route53:ChangeResourceRecordSets"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:PutSecretValue",
        "secretsmanager:CreateSecret",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:whatsthescore/openai-api-key*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

## Setup Steps

1. **Initialize Terraform**:
   ```bash
   cd terraform
   terraform init
   ```

2. **Plan the deployment**:
   ```bash
   terraform plan
   ```

3. **Apply the configuration**:
   ```bash
   terraform apply
   ```

4. **Get DNS validation records**:
   After applying, Terraform will output DNS validation records. You need to add these to your DNS provider (where duskaotearoa.co.nz is hosted).

5. **Wait for certificate validation** (can take 5-30 minutes)

6. **Update DNS**:
   - Create a CNAME record pointing `duskaotearoa.co.nz` to the CloudFront domain name
   - Or use Route 53 alias if your domain is in Route 53

## GitHub Actions Setup

Add these secrets to your GitHub repository:

- `AWS_ACCESS_KEY_ID` - Access key for `github-actions-deploy-front-user`
- `AWS_SECRET_ACCESS_KEY` - Secret key for `github-actions-deploy-front-user`
- `AWS_S3_BUCKET` - Set to `duskaotearoa.co.nz`
- `AWS_REGION` - Your AWS region (e.g., `us-east-1`)
- `AWS_CLOUDFRONT_DISTRIBUTION_ID` - CloudFront distribution ID (from Terraform output)

## Backend HTTPS Configuration

To ensure your frontend can hit your backend via HTTPS:

1. Make sure your backend API endpoints use HTTPS
2. Update your frontend API calls to use the HTTPS backend URL
3. Configure CORS on your backend to allow requests from `https://duskaotearoa.co.nz`

## Outputs

After `terraform apply`, you'll get:
- S3 bucket name
- CloudFront distribution ID
- CloudFront domain name
- Certificate ARN
- DNS validation records

