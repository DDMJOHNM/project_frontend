#!/bin/bash

# Bootstrap script to create S3 bucket and DynamoDB table for Terraform state
# Run this BEFORE configuring the S3 backend

set -e

BUCKET_NAME="duskaotearoa-terraform-state"
TABLE_NAME="terraform-state-lock"
REGION="us-east-1"

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &>/dev/null; then
  echo "❌ AWS credentials not configured!"
  echo ""
  echo "Please configure AWS credentials using one of these methods:"
  echo ""
  echo "Option 1: AWS Configure (Recommended)"
  echo "  aws configure"
  echo "  # Enter your AWS Access Key ID"
  echo "  # Enter your AWS Secret Access Key"
  echo "  # Enter region: us-east-1"
  echo "  # Enter output format: json (or press Enter)"
  echo ""
  echo "Option 2: Environment Variables"
  echo "  export AWS_ACCESS_KEY_ID='your-access-key'"
  echo "  export AWS_SECRET_ACCESS_KEY='your-secret-key'"
  echo "  export AWS_DEFAULT_REGION='us-east-1'"
  echo ""
  echo "Option 3: Use the same credentials as GitHub Actions"
  echo "  Get them from: GitHub Repo → Settings → Secrets → AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY"
  echo ""
  exit 1
fi

echo "✅ AWS credentials configured"
echo "Creating S3 bucket for Terraform state: $BUCKET_NAME"

# Create S3 bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION || echo "Bucket may already exist"

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket $BUCKET_NAME \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "Creating DynamoDB table for state locking: $TABLE_NAME"

# Create DynamoDB table
aws dynamodb create-table \
  --table-name $TABLE_NAME \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --tags Key=Name,Value="Terraform State Lock" Key=Purpose,Value="Terraform state locking" \
  || echo "Table may already exist"

echo ""
echo "✅ State bucket and DynamoDB table created!"
echo ""
echo "Next steps:"
echo "1. The backend.tf file is already configured"
echo "2. Run: cd terraform && terraform init -migrate-state"
echo "3. This will migrate your local state to S3"

