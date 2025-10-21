# AWS Infrastructure Setup

このディレクトリには、Deploy App Agent で使用する AWS インフラストラクチャの Terraform 設定が含まれています。

## 概要

このセットアップでは以下のリソースを作成します：

1. **S3 Bucket** - Terraform State の保存用
   - バージョニング有効化
   - サーバーサイド暗号化（AES256）
   - パブリックアクセスブロック

2. **IAM User** - Deploy App Agent 用のユーザー（オプション）
   - S3 フルアクセス
   - CloudFront 読み取り/書き込みアクセス
   - プログラマティックアクセス用のアクセスキー

3. **IAM Policy** - S3 と CloudFront 操作用のカスタムポリシー

## 前提条件

- Terraform >= 1.0
- AWS CLI がインストールされ、設定済み
- 適切な権限を持つ AWS アカウント

## セットアップ手順

### 1. 変数ファイルの設定

```bash
# terraform.tfvars.example をコピー
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvars を編集
vi terraform.tfvars
```

必須の変数:
```hcl
aws_region      = "ap-northeast-1"
bucket_name     = "your-unique-bucket-name-tfstate"
create_iam_user = true
iam_user_name   = "deploy-app-agent-user"
environment     = "dev"
```

### 2. Terraform の実行

```bash
# 初期化
terraform init

# プランの確認
terraform plan

# 適用
terraform apply
```

### 3. IAM アクセスキーの取得

```bash
# Access Key ID を取得
terraform output access_key_id

# Secret Access Key を取得
terraform output -raw secret_access_key
```

**重要**: Secret Access Key は一度しか表示されません。安全な場所に保存してください。

## 作成されるリソース

### S3 Bucket
- **名前**: `terraform.tfvars` で指定
- **用途**: Terraform State の保存
- **機能**:
  - バージョニング有効
  - AES256 暗号化
  - パブリックアクセス完全ブロック

### IAM User（`create_iam_user = true` の場合）
- **名前**: デフォルト `deploy-app-agent-user`
- **権限**:
  - S3: フルアクセス（全バケット）
  - CloudFront: Distribution の CRUD 操作
  - CloudFront: Invalidation の作成と管理
  - CloudFront: Origin Access Identity の管理

### IAM Policy
ポリシーには以下の権限が含まれます：
- S3 の全操作（`s3:*`）
- CloudFront Distribution の作成・更新・削除
- CloudFront Invalidation の作成
- CloudFront Origin Access Identity の管理

## Outputs

```bash
# 全ての出力を表示
terraform output

# 特定の出力を表示
terraform output tfstate_bucket_name
terraform output iam_user_name
terraform output access_key_id
terraform output -raw secret_access_key
```

利用可能な出力:
- `tfstate_bucket_name` - S3 バケット名
- `tfstate_bucket_arn` - S3 バケット ARN
- `iam_user_name` - IAM ユーザー名
- `iam_user_arn` - IAM ユーザー ARN
- `access_key_id` - アクセスキー ID (sensitive)
- `secret_access_key` - シークレットアクセスキー (sensitive)
- `policy_arn` - IAM ポリシー ARN

## Azure Container Instance との連携

作成したアクセスキーは、Azure Container Instance の環境変数として設定します：

```hcl
# setup/azure/terraform.tfvars に設定
aws_access_key_id     = "<terraform output -raw access_key_id の値>"
aws_secret_access_key = "<terraform output -raw secret_access_key の値>"
aws_region            = "ap-northeast-1"
```

## IAM ユーザーなしでセットアップ

既存の IAM ユーザーを使用する場合は、`create_iam_user = false` に設定：

```hcl
create_iam_user = false
```

この場合、S3 バケットのみが作成されます。

## セキュリティのベストプラクティス

1. **アクセスキーの保護**
   - Secret Access Key は安全に保存
   - 定期的なローテーション
   - 不要になったら即座に削除

2. **最小権限の原則**
   - 必要に応じてポリシーをカスタマイズ
   - 特定の S3 バケットのみにアクセスを制限

3. **terraform.tfvars の管理**
   - `.gitignore` に追加済み（コミットしない）
   - 機密情報を含むため注意

## クリーンアップ

全てのリソースを削除する場合：

```bash
terraform destroy
```

**注意**: IAM ユーザーを削除すると、そのアクセスキーも無効化されます。

## トラブルシューティング

### S3 バケット名が既に使用されている

```bash
# terraform.tfvars で bucket_name を変更
bucket_name = "your-unique-name-tfstate-$(date +%s)"
```

### IAM 権限エラー

Terraform を実行するユーザーには以下の権限が必要です：
- `s3:CreateBucket`, `s3:PutBucketVersioning`, etc.
- `iam:CreateUser`, `iam:CreatePolicy`, `iam:AttachUserPolicy`

### アクセスキーが表示されない

```bash
# sensitive な出力を表示
terraform output -raw secret_access_key
```

## 参考情報

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS IAM Documentation](https://docs.aws.amazon.com/iam/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
