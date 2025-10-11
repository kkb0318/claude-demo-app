terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = "agent-galaxy"

  default_tags {
    tags = {
      ManagedBy = "Terraform"
      Purpose   = "TFState Backend"
    }
  }
}
