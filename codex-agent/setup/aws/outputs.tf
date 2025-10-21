output "tfstate_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.tfstate.id
}

output "tfstate_bucket_arn" {
  description = "ARN of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.tfstate.arn
}

output "iam_user_name" {
  description = "Name of the IAM user for Deploy App Agent"
  value       = var.create_iam_user ? aws_iam_user.deploy_app_agent[0].name : "N/A - IAM user not created"
}

output "iam_user_arn" {
  description = "ARN of the IAM user for Deploy App Agent"
  value       = var.create_iam_user ? aws_iam_user.deploy_app_agent[0].arn : "N/A - IAM user not created"
}

output "access_key_id" {
  description = "Access Key ID for the IAM user"
  value       = var.create_iam_user ? aws_iam_access_key.deploy_app_agent[0].id : "N/A - IAM user not created"
  sensitive   = true
}

output "secret_access_key" {
  description = "Secret Access Key for the IAM user"
  value       = var.create_iam_user ? aws_iam_access_key.deploy_app_agent[0].secret : "N/A - IAM user not created"
  sensitive   = true
}

output "policy_arn" {
  description = "ARN of the IAM policy attached to the user"
  value       = var.create_iam_user ? aws_iam_policy.deploy_app_agent[0].arn : "N/A - IAM user not created"
}
