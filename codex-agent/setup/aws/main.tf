# S3 Bucket for Terraform State
resource "aws_s3_bucket" "tfstate" {
  bucket = var.bucket_name

  tags = {
    Name = "Terraform State Bucket"
  }
}

# Enable versioning for the S3 bucket
resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption for the S3 bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access to the S3 bucket
resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM User for Deploy App Agent
resource "aws_iam_user" "deploy_app_agent" {
  count = var.create_iam_user ? 1 : 0
  name  = var.iam_user_name

  tags = {
    Name        = "Deploy App Agent User"
    Purpose     = "Application deployment and S3/CloudFront operations"
    Environment = var.environment
  }
}

# IAM Access Key for the user
resource "aws_iam_access_key" "deploy_app_agent" {
  count = var.create_iam_user ? 1 : 0
  user  = aws_iam_user.deploy_app_agent[0].name
}

# IAM Policy for S3 and CloudFront access
resource "aws_iam_policy" "deploy_app_agent" {
  count       = var.create_iam_user ? 1 : 0
  name        = "${var.iam_user_name}-policy"
  description = "Policy for Deploy App Agent - S3 and CloudFront operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3FullAccess"
        Effect = "Allow"
        Action = [
          "s3:*"
        ]
        Resource = [
          "arn:aws:s3:::*",
          "arn:aws:s3:::*/*"
        ]
      },
      {
        Sid    = "CloudFrontFullAccess"
        Effect = "Allow"
        Action = [
          "cloudfront:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "ACMReadAccess"
        Effect = "Allow"
        Action = [
          "acm:ListCertificates",
          "acm:DescribeCertificate"
        ]
        Resource = "*"
      },
      {
        Sid    = "IAMReadAccess"
        Effect = "Allow"
        Action = [
          "iam:GetServerCertificate",
          "iam:ListServerCertificates"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.iam_user_name} Policy"
    Environment = var.environment
  }
}

# Attach the policy to the user
resource "aws_iam_user_policy_attachment" "deploy_app_agent" {
  count      = var.create_iam_user ? 1 : 0
  user       = aws_iam_user.deploy_app_agent[0].name
  policy_arn = aws_iam_policy.deploy_app_agent[0].arn
}
