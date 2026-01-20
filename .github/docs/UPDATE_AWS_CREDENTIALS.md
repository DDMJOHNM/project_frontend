# How to Update Expired AWS Credentials

Your AWS credentials have expired. Follow these steps to update them.

## Step 1: Get Your AWS Credentials

You need your AWS Access Key ID and Secret Access Key. Get them from:

### Option A: GitHub Secrets (Easiest)
1. Go to: https://github.com/DDMJOHNM/WhatsTheScore/settings/secrets/actions
2. Find `AWS_ACCESS_KEY_ID` - click "Show" and copy it
3. Find `AWS_SECRET_ACCESS_KEY` - click "Show" and copy it

### Option B: AWS IAM Console
1. Go to: https://console.aws.amazon.com/iam/
2. Click **Users** → `github-actions-deploy-front-user`
3. Click **Security credentials** tab
4. Under **Access keys**, either:
   - Use existing key (click "Show" to reveal secret)
   - Or create new access key

## Step 2: Update Credentials

### Method 1: Using AWS Configure (Recommended)

```bash
aws configure
```

Enter when prompted:
- **AWS Access Key ID**: `[paste your access key]`
- **AWS Secret Access Key**: `[paste your secret key]`
- **Default region**: `us-east-1` (press Enter)
- **Default output format**: `json` (press Enter)

### Method 2: Edit Credentials File Directly

```bash
nano ~/.aws/credentials
```

Update the `[default]` section:
```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY_HERE
aws_secret_access_key = YOUR_SECRET_KEY_HERE
```

Save and exit (Ctrl+X, then Y, then Enter).

### Method 3: Use Environment Variables (Temporary)

```bash
export AWS_ACCESS_KEY_ID='your-access-key-id'
export AWS_SECRET_ACCESS_KEY='your-secret-access-key'
export AWS_DEFAULT_REGION='us-east-1'
```

**Note**: This only works for the current terminal session.

## Step 3: Verify Credentials Work

```bash
aws sts get-caller-identity
```

You should see output like:
```json
{
    "UserId": "AIDA...",
    "Account": "051826704696",
    "Arn": "arn:aws:iam::051826704696:user/github-actions-deploy-front-user"
}
```

## Step 4: Check Certificate Status

Once credentials are working:

```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:051826704696:certificate/d11bce29-ac3d-4ec5-93b3-912f52466576 \
  --region us-east-1 \
  --query 'Certificate.Status'
```

## Troubleshooting

### Still Getting Expired Token?

1. **Check which profile is active**:
   ```bash
   aws configure list
   ```

2. **Clear any cached credentials**:
   ```bash
   unset AWS_SESSION_TOKEN
   unset AWS_PROFILE
   ```

3. **Verify credentials file**:
   ```bash
   cat ~/.aws/credentials
   ```
   Make sure the `[default]` section has valid credentials (no session tokens unless they're fresh).

### Need to Create New Access Key?

1. Go to AWS IAM Console
2. Users → `github-actions-deploy-front-user`
3. Security credentials → Create access key
4. **Important**: Update GitHub Secrets with the new key too!

