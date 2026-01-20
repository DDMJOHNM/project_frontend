# How to Find Your Backend URL

This guide shows you how to find your backend API URL from your [backend repository](https://github.com/DDMJOHNM/johns_ai_project_backend).

## Method 1: Check GitHub Actions (Easiest)

If your backend is deployed via GitHub Actions:

1. Go to your backend repository: https://github.com/DDMJOHNM/johns_ai_project_backend
2. Click on the **Actions** tab
3. Find the most recent successful deployment workflow
4. Click on the workflow run
5. Look for the **deployment summary** or **job output**
6. You should see output like:
   ```
   Load Balancer DNS: johns-ai-backend-ec2-alb-123456.us-east-1.elb.amazonaws.com
   Backend URL: http://johns-ai-backend-ec2-alb-123456.us-east-1.elb.amazonaws.com
   ```
   Or for API Gateway:
   ```
   API Gateway URL: https://XXXXXX.execute-api.us-east-1.amazonaws.com/prod
   ```

## Method 2: AWS Console - EC2 + Load Balancer

If your backend uses EC2 + Application Load Balancer:

1. **Log into AWS Console**
2. **Go to EC2** → **Load Balancers**
3. **Find your load balancer** (look for name containing "backend" or "johns-ai")
4. **Click on the load balancer**
5. **Copy the DNS name** (e.g., `johns-ai-backend-ec2-alb-123456.us-east-1.elb.amazonaws.com`)
6. **Your backend URL**: `http://[DNS-NAME]` or `https://[DNS-NAME]` if HTTPS is configured

## Method 3: AWS Console - API Gateway

If your backend uses API Gateway:

1. **Log into AWS Console**
2. **Go to API Gateway**
3. **Find your API** (look for "johns-ai-backend" or similar)
4. **Click on the API**
5. **Go to Stages** → Click on your stage (e.g., `prod`)
6. **Copy the Invoke URL** (e.g., `https://XXXXXX.execute-api.us-east-1.amazonaws.com/prod`)
7. **Your backend URL**: The Invoke URL

## Method 4: AWS CLI Commands

### Find EC2 Load Balancer:

```bash
# List all load balancers
aws elbv2 describe-load-balancers --region us-east-1

# Filter for backend load balancer
aws elbv2 describe-load-balancers --region us-east-1 \
  --query 'LoadBalancers[?contains(LoadBalancerName, `backend`) || contains(LoadBalancerName, `johns-ai`)].DNSName' \
  --output text
```

### Find API Gateway:

```bash
# List all APIs
aws apigateway get-rest-apis --region us-east-1

# Get API Gateway URL (replace API_ID and STAGE_NAME)
aws apigateway get-stage \
  --rest-api-id YOUR_API_ID \
  --stage-name prod \
  --region us-east-1 \
  --query 'invokeUrl' \
  --output text
```

### Find CloudFormation Stack Outputs:

If your backend was deployed via CloudFormation:

```bash
# List stacks
aws cloudformation list-stacks --region us-east-1 \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Get stack outputs (replace STACK_NAME)
aws cloudformation describe-stacks \
  --stack-name johns-ai-backend-ec2 \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`BackendURL` || OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text
```

## Method 5: Check Backend Repository README

1. Go to: https://github.com/DDMJOHNM/johns_ai_project_backend
2. Check the **README.md** for deployment instructions
3. Look for deployment outputs or URLs mentioned in the documentation

## Method 6: Test Common Endpoints

If you know the approximate URL format, test it:

```bash
# Test health endpoint (common endpoint)
curl http://johns-ai-backend-ec2-alb-XXXXXX.us-east-1.elb.amazonaws.com/health

# Or for API Gateway
curl https://XXXXXX.execute-api.us-east-1.amazonaws.com/prod/health
```

## Current Backend URL in Code

Your frontend code currently references:
- **Old API Gateway**: `https://beobftaez9.execute-api.us-west-2.amazonaws.com/prod`

You can test if this still works:
```bash
curl https://beobftaez9.execute-api.us-west-2.amazonaws.com/prod/health
```

## Once You Find It

1. **For Local Development**: Add to `.env.local`:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://your-backend-url
   ```

2. **For Production**: Add to GitHub Secrets:
   - Name: `BACKEND_URL`
   - Value: Your backend URL

3. **Test the Connection**:
   ```bash
   curl http://your-backend-url/health
   ```

## Quick Checklist

- [ ] Check GitHub Actions deployment logs
- [ ] Check AWS Console → EC2 → Load Balancers
- [ ] Check AWS Console → API Gateway
- [ ] Check CloudFormation stack outputs
- [ ] Test the old API Gateway URL
- [ ] Check backend repository README

## Need Help?

If you can't find it:
1. Check your backend repository's GitHub Actions
2. Look at the backend deployment configuration
3. Check AWS CloudFormation stacks
4. Contact your backend deployment team


