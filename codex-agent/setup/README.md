# Terraform State Backend Setup

このディレクトリには、Terraformのリモートステート管理用のS3バケットを作成するためのコードが含まれています。

## 概要

以下のリソースが作成されます:

- **S3 Bucket**: Terraformのステートファイルを保存
  - バージョニング有効化
  - サーバーサイド暗号化 (AES256)
  - パブリックアクセスブロック

## 使用方法

### 1. 初期化

```bash
terraform init
```

### 2. プランの確認

```bash
terraform plan
```

### 3. リソースの作成

```bash
terraform apply
```

### 4. 他のプロジェクトでの使用

作成後、他のTerraformプロジェクトで以下のようなbackend設定を使用できます:

```hcl
terraform {
  backend "s3" {
    bucket  = "agent-galaxy-tfstate-storage"
    key     = "path/to/terraform.tfstate"
    region  = "ap-northeast-1"
    profile = "agent-galaxy"
    encrypt = true
  }
}
```

## 変数のカスタマイズ

必要に応じて、以下の変数を変更できます:

- `aws_region`: AWSリージョン (デフォルト: ap-northeast-1)
- `bucket_name`: S3バケット名 (デフォルト: agent-galaxy-tfstate)

変数を変更する場合は、`terraform.tfvars`ファイルを作成するか、`-var`オプションを使用してください。

## 注意事項

- このコードを実行する前に、AWS CLIで`agent-galaxy`プロファイルが設定されていることを確認してください
- S3バケット名はグローバルで一意である必要があります
- 一度作成したリソースを削除する際は、他のプロジェクトで使用していないことを確認してください
