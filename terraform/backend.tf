# S3 Backend Configuration for Terraform State
# This stores the Terraform state file in S3 instead of locally

terraform {
  backend "s3" {
    # Update these values with your actual bucket name
    bucket         = "duskaotearoa-terraform-state"
    key            = "duskaotearoa.co.nz/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"  # Optional: for state locking
  }
}

