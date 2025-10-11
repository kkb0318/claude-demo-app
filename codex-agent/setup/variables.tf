variable "aws_region" {
  description = "AWS region for the tfstate bucket"
  type        = string
  default     = "ap-northeast-1"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for tfstate"
  type        = string
  default     = "agent-galaxy-tfstate-storage"
}
