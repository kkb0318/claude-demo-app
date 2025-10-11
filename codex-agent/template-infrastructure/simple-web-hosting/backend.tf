terraform {
  backend "s3" {
    # Example usage:
    # terraform init \
    #   -backend-config="bucket=your-terraform-state-bucket" \
    #   -backend-config="key=simple-web-hosting/terraform.tfstate" \

    bucket = "your-terraform-state-bucket"
    region = "ap-northeast-1"
    # key            = "simple-web-hosting/terraform.tfstate"
  }
}
