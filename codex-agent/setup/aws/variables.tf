variable "aws_region" {
  description = "AWS region for the tfstate bucket"
  type        = string
  default     = "ap-northeast-1"
}

variable "aws_profile" {
  description = "AWS CLI profile to use (optional)"
  type        = string
  default     = "683712948257_AdministratorAccess"
  # default     = "agent-galaxy"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for tfstate"
  type        = string
  default     = "agent-galaxy-tfstate-storage"
}

variable "create_iam_user" {
  description = "Whether to create IAM user for Deploy App Agent"
  type        = bool
  default     = true
}

variable "iam_user_name" {
  description = "Name of the IAM user for Deploy App Agent"
  type        = string
  default     = "deploy-app-agent-user"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}
