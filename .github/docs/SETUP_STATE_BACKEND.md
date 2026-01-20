# Setting Up Terraform S3 Backend for State Storage

This guide explains how to configure Terraform to store state files in S3 instead of locally.

## Why Use S3 Backend?

✅ **Team collaboration** - Multiple people can work with the same state  
✅ **State protection** - Prevents accidental loss of state file  
✅ **State locking** - Prevents concurrent modifications (with DynamoDB)  
✅ **Version history** - S3 versioning keeps history of state changes  
✅ **Security** - Encrypted state storage  

## Prerequisites: Configure AWS Credentials

**Before running the bootstrap script**, you need to configure AWS credentials locally.

### Configure AWS CLI

```bash
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Your IAM user access key (same as `AWS_ACCESS_KEY_ID` in GitHub Secrets)
- **AWS Secret Access Key**: Your IAM user secret key (same as `AWS_SECRET_ACCESS_KEY` in GitHub Secrets)
- **Default region**: `us-east-1`
- **Default output format**: `json` (or press Enter)

### Verify Credentials

```bash
aws sts get-caller-identity
```

This should return your AWS account ID and user ARN.

### Alternative: Environment Variables

If you prefer not to use `aws configure`:

```bash
export AWS_ACCESS_KEY_ID='your-access-key'
export AWS_SECRET_ACCESS_KEY='your-secret-key'
export AWS_DEFAULT_REGION='us-east-1'
```

## Step 1: Create State Bucket and DynamoDB Table

**IMPORTANT**: The S3 bucket must exist BEFORE you can use the S3 backend.

You have three options:

### Option A: Use Bootstrap Script (Easiest)

```bash
cd terraform
./bootstrap-state.sh
```

This creates:
- S3 bucket: `duskaotearoa-terraform-state`
- DynamoDB table: `terraform-state-lock`

**Note**: The script will check for AWS credentials and provide helpful error messages if they're missing.

### Option B: Use Terraform to Create Them

1. **Temporarily remove the backend configuration**:
   - Comment out or remove the `backend "s3"` block from `backend.tf` (if it exists)
   - Or rename `backend.tf` to `backend.tf.disabled`

2. **Run Terraform to create the state resources**:
   ```bash
   cd terraform
   terraform init
   terraform apply -target=aws_s3_bucket.terraform_state -target=aws_dynamodb_table.terraform_state_lock
   ```

3. **Re-enable the backend configuration**:
   - Uncomment or restore the `backend "s3"` block
   - Or rename `backend.tf.disabled` back to `backend.tf`

4. **Migrate existing state**:
   ```bash
   terraform init -migrate-state
   ```

### Option B: Create Manually via AWS Console

1. **Create S3 Bucket**:
   - Name: `duskaotearoa-terraform-state`
   - Region: `us-east-1`
   - Enable versioning
   - Enable encryption (AES256)
   - Block all public access

2. **Create DynamoDB Table**:
   - Name: `terraform-state-lock`
   - Partition key: `LockID` (String)
   - Billing mode: On-demand

## Step 2: Configure Backend

1. **Update `backend.tf`** with your bucket name:
   ```hcl
   terraform {
     backend "s3" {
       bucket         = "duskaotearoa-terraform-state"
       key            = "duskaotearoa.co.nz/terraform.tfstate"
       region         = "us-east-1"
       encrypt        = true
       dynamodb_table = "terraform-state-lock"
     }
   }
   ```

2. **Initialize Terraform with backend**:
   ```bash
   cd terraform
   terraform init
   ```

   If you have existing local state, Terraform will ask:
   ```
   Do you want to copy existing state to the new backend?
   ```
   Answer: **Yes**

## Step 3: Verify

1. **Check state is in S3**:
   ```bash
   aws s3 ls s3://duskaotearoa-terraform-state/duskaotearoa.co.nz/
   ```

2. **Run a Terraform plan**:
   ```bash
   terraform plan
   ```

3. **Verify DynamoDB table exists**:
   ```bash
   aws dynamodb describe-table --table-name terraform-state-lock --region us-east-1
   ```

## IAM Permissions Required

Your IAM user `github-actions-deploy-front-user` needs these additional permissions:

```json
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::duskaotearoa-terraform-state",
    "arn:aws:s3:::duskaotearoa-terraform-state/*"
  ]
},
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:DeleteItem"
  ],
  "Resource": "arn:aws:dynamodb:us-east-1:*:table/terraform-state-lock"
}
```

## Migration from Local State

If you already have a local state file:

1. **Backup your local state**:
   ```bash
   cp terraform/terraform.tfstate terraform/terraform.tfstate.backup
   ```

2. **Initialize with backend**:
   ```bash
   terraform init -migrate-state
   ```

3. **Verify migration**:
   ```bash
   terraform plan  # Should show no changes if migration was successful
   ```

## Troubleshooting

### Error: "Backend configuration changed"

**Solution**: Run `terraform init -reconfigure`

### Error: "Failed to get lock"

**Solution**: 
- Another Terraform run might be in progress
- Check DynamoDB table for stuck locks
- Or manually delete the lock entry

### Error: "Access Denied" to S3

**Solution**: 
- Verify IAM permissions
- Check bucket name is correct
- Ensure bucket exists in the correct region

## Security Best Practices

1. ✅ **Enable encryption** on the state bucket
2. ✅ **Enable versioning** for state history
3. ✅ **Block public access** to the state bucket
4. ✅ **Use IAM policies** to restrict access
5. ✅ **Enable DynamoDB locking** to prevent conflicts
6. ✅ **Rotate access keys** regularly

