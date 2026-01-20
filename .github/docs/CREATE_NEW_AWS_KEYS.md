# Creating New AWS Access Keys

Follow these steps to create new AWS access keys and update your local configuration.

## Step 1: Create New Access Key in AWS Console

1. **Go to AWS IAM Console:**
   - Visit: https://console.aws.amazon.com/iam/
   - Make sure you're in the correct AWS account (Account ID: 051826704696)

2. **Navigate to the User:**
   - Click **Users** in the left sidebar
   - Find and click on: `github-actions-deploy-front-user`

3. **Go to Security Credentials:**
   - Click the **Security credentials** tab

4. **Create Access Key:**
   - Scroll down to **Access keys** section
   - Click **Create access key** button

5. **Choose Use Case:**
   - Select **Command Line Interface (CLI)**
   - Check the confirmation box
   - Click **Next**

6. **Add Description (Optional):**
   - Add a description like: "Local development - 2024"
   - Click **Create access key**

7. **Copy Your Keys:**
   - **IMPORTANT**: Copy both values immediately - you won't be able to see the secret key again!
   - **Access Key ID**: `AKIA...` (copy this)
   - **Secret Access Key**: `...` (copy this)
   - Click **Download .csv file** as backup (optional but recommended)

## Step 2: Get Session Token (If Required)

Session tokens are needed if you're using:
- **AWS SSO** (Single Sign-On)
- **MFA-protected credentials**
- **Temporary credentials from assuming a role**

### Option A: Using AWS SSO

If you're using AWS SSO:

```bash
aws sso login --profile your-sso-profile
```

This will generate temporary credentials with a session token.

### Option B: Using MFA (Multi-Factor Authentication)

If your IAM user requires MFA:

```bash
aws sts get-session-token \
  --serial-number arn:aws:iam::051826704696:mfa/your-username \
  --token-code 123456
```

Replace:
- `your-username` with your IAM username
- `123456` with your current MFA code

This will return temporary credentials including a session token.

### Option C: Assume Role (If Using Role-Based Access)

If you need to assume a role:

```bash
aws sts assume-role \
  --role-arn arn:aws:iam::051826704696:role/YourRoleName \
  --role-session-name my-session
```

This returns temporary credentials with a session token.

### Option D: Direct IAM User (No Session Token Needed)

If you're using direct IAM user credentials (not SSO, not MFA, not assuming a role), you **don't need a session token**. Skip to Step 3.

## Step 3: Update Local AWS Credentials

### Option A: Using AWS Configure (For Permanent Credentials)

```bash
aws configure
```

Enter when prompted:
- **AWS Access Key ID**: `[paste your new Access Key ID]`
- **AWS Secret Access Key**: `[paste your new Secret Access Key]`
- **Default region**: `us-east-1` (press Enter)
- **Default output format**: `json` (press Enter)

**Note**: This method doesn't set session tokens. For session tokens, use Option B.

### Option B: Edit Credentials File Directly (For Session Tokens)

```bash
nano ~/.aws/credentials
```

Update the `[default]` section:

**If you have a session token:**
```ini
[default]
aws_access_key_id = YOUR_NEW_ACCESS_KEY_ID_HERE
aws_secret_access_key = YOUR_NEW_SECRET_ACCESS_KEY_HERE
aws_session_token = YOUR_SESSION_TOKEN_HERE
```

**If you don't need a session token (direct IAM user):**
```ini
[default]
aws_access_key_id = YOUR_NEW_ACCESS_KEY_ID_HERE
aws_secret_access_key = YOUR_NEW_SECRET_ACCESS_KEY_HERE
```

Save and exit:
- Press `Ctrl+X`
- Press `Y` to confirm
- Press `Enter` to save

### Option C: Set Environment Variables (Temporary)

For the current terminal session only:

```bash
export AWS_ACCESS_KEY_ID='your-access-key-id'
export AWS_SECRET_ACCESS_KEY='your-secret-access-key'
export AWS_SESSION_TOKEN='your-session-token'  # Only if needed
export AWS_DEFAULT_REGION='us-east-1'
```

## Step 4: Verify Credentials Work

```bash
aws sts get-caller-identity
```

You should see:
```json
{
    "UserId": "AIDA...",
    "Account": "051826704696",
    "Arn": "arn:aws:iam::051826704696:user/github-actions-deploy-front-user"
}
```

## Step 5: Update GitHub Secrets (IMPORTANT!)

Your GitHub Actions deployment also needs these credentials. Update them:

1. **Go to GitHub Secrets:**
   - Visit: https://github.com/DDMJOHNM/WhatsTheScore/settings/secrets/actions

2. **Update AWS_ACCESS_KEY_ID:**
   - Find `AWS_ACCESS_KEY_ID`
   - Click **Update**
   - Paste your new Access Key ID
   - Click **Update secret**

3. **Update AWS_SECRET_ACCESS_KEY:**
   - Find `AWS_SECRET_ACCESS_KEY`
   - Click **Update**
   - Paste your new Secret Access Key
   - Click **Update secret**

**⚠️ Important**: Without updating GitHub Secrets, your CI/CD pipeline will fail on the next deployment!

## Step 6: Test Certificate Status

Once credentials are working:

```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:051826704696:certificate/d11bce29-ac3d-4ec5-93b3-912f52466576 \
  --region us-east-1 \
  --query 'Certificate.Status'
```

## Troubleshooting

### Still Getting Expired Token?

1. **Check if you need a session token:**
   - If using AWS SSO: Run `aws sso login`
   - If using MFA: Get new session token with MFA code
   - If using direct IAM user: You shouldn't need a session token

2. **Clear and reset credentials:**
   ```bash
   unset AWS_SESSION_TOKEN
   unset AWS_PROFILE
   # Then reconfigure
   aws configure
   ```

3. **Verify credentials file:**
   ```bash
   cat ~/.aws/credentials
   ```
   - If using session tokens: Make sure `aws_session_token` is present and not expired
   - If using direct IAM: Make sure there's NO `aws_session_token` line

4. **Check token expiration:**
   ```bash
   aws sts get-caller-identity
   ```
   If this fails, your session token may be expired. Get a new one.

5. **Try a fresh terminal session:**
   ```bash
   # Close and reopen terminal, then:
   aws sts get-caller-identity
   ```

### Old Access Keys

If you want to deactivate old access keys (recommended for security):

1. Go to IAM → Users → `github-actions-deploy-front-user` → Security credentials
2. Find old access keys under **Access keys**
3. Click the **...** menu → **Deactivate** or **Delete**

**Note**: Only deactivate/delete old keys AFTER you've confirmed the new ones work and GitHub Secrets are updated!

