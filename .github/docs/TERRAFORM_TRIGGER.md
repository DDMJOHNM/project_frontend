# How Terraform Gets Triggered

## Current Setup: Automatic via GitHub Actions ✅

Terraform is now **automatically triggered** when you push to the `main` branch.

## How It Works

### Automatic Trigger

1. **Push to `main` branch** → GitHub Actions workflow starts
2. **Terraform runs automatically**:
   - `terraform init` - Initializes Terraform
   - `terraform plan` - Shows what will change
   - `terraform apply` - Applies changes (only on `main` branch)
3. **Gets CloudFront ID** from Terraform output
4. **Deploys your app** to S3
5. **Invalidates CloudFront cache**

### Workflow Steps

The workflow now includes:

```yaml
- Setup Terraform
- Terraform Init
- Terraform Plan (shows changes)
- Terraform Apply (creates/updates infrastructure)
- Get CloudFront Distribution ID (from Terraform output)
- Deploy to S3
- Invalidate CloudFront cache
```

## Manual Execution (Alternative)

You can still run Terraform manually from your local machine:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

**Note**: If you run manually, make sure to:
- Have AWS credentials configured
- Be in the correct AWS region
- Have proper IAM permissions

## When Terraform Runs

- ✅ **Automatically**: On every push to `main` branch
- ✅ **On infrastructure changes**: When `terraform/` files are modified
- ✅ **Before deployment**: Terraform runs before S3 deployment

## Terraform State

**Current**: Terraform state is stored **locally** in `terraform/terraform.tfstate`

**Recommendation**: For production, configure remote state (S3 backend) to:
- Share state across team members
- Protect against local file loss
- Enable state locking

See `terraform/main.tf` for commented-out S3 backend configuration.

## First-Time Setup

Before the first automatic run:

1. **Run Terraform manually once** to create initial infrastructure:
   ```bash
   cd terraform
   terraform init
   terraform apply
   ```

2. **Save the CloudFront Distribution ID**:
   - From Terraform output, or
   - Add to GitHub Secret: `AWS_CLOUDFRONT_DISTRIBUTION_ID`

3. **Future deployments** will run Terraform automatically

## Troubleshooting

### Terraform Fails in GitHub Actions

- Check IAM permissions for `github-actions-deploy-front-user`
- Verify AWS credentials in GitHub Secrets
- Review Terraform logs in GitHub Actions

### State Lock Errors

- Another Terraform run might be in progress
- Wait for previous run to complete
- Or configure S3 backend with DynamoDB for state locking

