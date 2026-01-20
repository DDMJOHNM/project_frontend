#!/bin/bash

# Manual deployment script for duskaotearoa.co.nz
# Run this after refreshing your AWS credentials

set -e  # Exit on error

echo "🚀 Starting deployment to duskaotearoa.co.nz..."

# Check AWS credentials
echo "Checking AWS credentials..."
aws sts get-caller-identity || {
    echo "❌ AWS credentials not configured or expired"
    echo "Please refresh your credentials first:"
    echo "  aws sso login"
    exit 1
}

# Build the app
echo "📦 Building Next.js app..."
pnpm build

# Check if out directory exists
if [ ! -d "./out" ]; then
    echo "❌ Build failed - out directory not found"
    exit 1
fi

echo "✅ Build complete"

# Deploy to S3
echo "☁️  Deploying to S3 bucket: duskaotearoa.co.nz..."
aws s3 sync ./out s3://duskaotearoa.co.nz --delete --exact-timestamps

echo "✅ Files uploaded to S3"

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id E209UM3L4LHZOE \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "✅ CloudFront invalidation created: $INVALIDATION_ID"

echo ""
echo "✨ Deployment complete!"
echo ""
echo "Your site will be available at:"
echo "  https://duskaotearoa.co.nz (once DNS is configured)"
echo "  https://d25wety08wrwk0.cloudfront.net (CloudFront URL)"
echo ""
echo "⚠️  IMPORTANT: Configure your DNS to point to CloudFront:"
echo "  Add CNAME record: duskaotearoa.co.nz -> d25wety08wrwk0.cloudfront.net"
echo ""

