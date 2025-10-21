variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group to create"
  type        = string
  default     = "rg-deploy-app-agent"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "japaneast"
}

variable "vnet_name" {
  description = "Name of the Virtual Network to create"
  type        = string
  default     = "vnet-deploy-app-agent"
}

variable "vnet_address_space" {
  description = "Address space for the Virtual Network"
  type        = string
  default     = "10.1.0.0/16"
}

variable "subnet_address_prefix" {
  description = "Address prefix for the Container Instances subnet"
  type        = string
  default     = "10.1.1.0/24"
}

variable "acr_name" {
  description = "Name of the Azure Container Registry (must be globally unique, alphanumeric only)"
  type        = string
  default     = "acrdeployappagent"
}

variable "acr_sku" {
  description = "SKU tier for Azure Container Registry"
  type        = string
  default     = "Basic"
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.acr_sku)
    error_message = "ACR SKU must be Basic, Standard, or Premium."
  }
}

variable "container_image" {
  description = "Docker container image to deploy (image name and tag, e.g., 'deploy-app-agent-api:latest')"
  type        = string
  default     = "deploy-app-agent-api:latest"
}

variable "openai_api_key" {
  description = "OpenAI API Key for the application"
  type        = string
  sensitive   = true
}

variable "aws_access_key_id" {
  description = "AWS Access Key ID for S3 and CloudFront operations"
  type        = string
  default     = ""
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key for S3 and CloudFront operations"
  type        = string
  default     = ""
  sensitive   = true
}

variable "aws_region" {
  description = "AWS Region for S3 and CloudFront operations"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "CodingAgent"
    ManagedBy   = "Terraform"
    Environment = "dev"
  }
}
