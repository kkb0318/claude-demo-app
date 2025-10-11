variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "ap-northeast-1"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for website hosting (must be globally unique)"
  type        = string
}

variable "default_root_object" {
  description = "Default root object for CloudFront distribution"
  type        = string
  default     = "index.html"
}

