#!/bin/bash

# Migrate DNS from Crazy Domains to AWS Route 53
# This will create a hosted zone and configure DNS records properly

set -e

DOMAIN="duskaotearoa.co.nz"
CLOUDFRONT_DOMAIN="d25wety08wrwk0.cloudfront.net"
CLOUDFRONT_DISTRIBUTION_ID="E209UM3L4LHZOE"

echo "🚀 Migrating DNS to AWS Route 53..."
echo ""

# Check AWS credentials
echo "Checking AWS credentials..."
aws sts get-caller-identity || {
    echo "❌ AWS credentials not configured"
    echo "Please refresh your credentials first:"
    echo "  aws sso login"
    exit 1
}

# Create hosted zone
echo ""
echo "Creating Route 53 hosted zone for $DOMAIN..."
HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
    --name $DOMAIN \
    --caller-reference $(date +%s) \
    --query 'HostedZone.Id' \
    --output text 2>/dev/null || aws route53 list-hosted-zones \
    --query "HostedZones[?Name=='${DOMAIN}.'].Id" \
    --output text)

HOSTED_ZONE_ID=$(echo $HOSTED_ZONE_ID | sed 's/\/hostedzone\///')

echo "✅ Hosted Zone ID: $HOSTED_ZONE_ID"

# Get CloudFront Distribution details
echo ""
echo "Getting CloudFront distribution details..."
CLOUDFRONT_HOSTED_ZONE_ID=$(aws cloudfront get-distribution \
    --id $CLOUDFRONT_DISTRIBUTION_ID \
    --query 'Distribution.DomainName' \
    --output text | grep -q "cloudfront.net" && echo "Z2FDTNDATAQYW2")

# Create DNS records
echo ""
echo "Creating DNS records..."

# Create change batch JSON
cat > /tmp/route53-changes.json <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CLOUDFRONT_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.$DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CLOUDFRONT_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

# Apply changes
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file:///tmp/route53-changes.json

echo "✅ DNS records created"

# Get nameservers
echo ""
echo "📋 IMPORTANT: Update nameservers at Crazy Domains"
echo "=================================================="
echo ""
echo "Your new AWS Route 53 nameservers are:"
echo ""
aws route53 get-hosted-zone \
    --id $HOSTED_ZONE_ID \
    --query 'DelegationSet.NameServers' \
    --output table

echo ""
echo "🔧 ACTION REQUIRED:"
echo "1. Log in to Crazy Domains"
echo "2. Go to your domain management for $DOMAIN"
echo "3. Find 'Nameservers' or 'DNS Settings'"
echo "4. Change nameservers to the ones shown above"
echo "5. Save changes"
echo ""
echo "⏱️  DNS propagation will take 1-48 hours (usually 2-6 hours)"
echo ""
echo "To check status:"
echo "  dig $DOMAIN"
echo "  dig www.$DOMAIN"
echo ""
echo "✨ Once nameservers are updated, your site will work!"

# Cleanup
rm -f /tmp/route53-changes.json

