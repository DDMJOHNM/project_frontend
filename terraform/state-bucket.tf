# Resources to create the S3 bucket and DynamoDB table for Terraform state
# NOTE: These resources are typically created by bootstrap-state.sh
# If they already exist, you have two options:
#   1. Import them: terraform import aws_s3_bucket.terraform_state duskaotearoa-terraform-state
#   2. Comment out these resources (they're not needed for the main infrastructure)

# S3 Bucket for Terraform State
# Comment this out if the bucket already exists and you don't want to manage it with Terraform
resource "aws_s3_bucket" "terraform_state" {
  bucket = "duskaotearoa-terraform-state"

  tags = {
    Name        = "Terraform State Bucket"
    Environment = "production"
    Purpose     = "Terraform state storage"
  }
}

# Enable versioning on state bucket
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption on state bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access to state bucket
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets  = true
}

# DynamoDB Table for State Locking (prevents concurrent modifications)
resource "aws_dynamodb_table" "terraform_state_lock" {
  name           = "terraform-state-lock"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "Terraform State Lock"
    Environment = "production"
    Purpose     = "Terraform state locking"
  }
}

# Output the bucket name for reference
output "terraform_state_bucket" {
  description = "S3 bucket name for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_state_lock_table" {
  description = "DynamoDB table name for Terraform state locking"
  value       = aws_dynamodb_table.terraform_state_lock.name
}

