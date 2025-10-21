# Azure Container Instances デプロイメントガイド

このディレクトリには、Coding Agent API を Azure Container Instances にデプロイするための Terraform 設定が含まれています。

## アーキテクチャ

- **Azure Container Instances**: Web API サーバーをホスト
- **Virtual Network**: 既存の VNet を使用
- **Private IP**: パブリックアクセスなし、VNet 内からのみアクセス可能
- **Network Security Group**: トラフィック制御
- **Health Checks**: Liveness と Readiness プローブ

## 前提条件

1. **Azure CLI がインストールされていること**
   ```bash
   az --version
   ```

2. **Azure にログインしていること**
   ```bash
   az login
   ```

3. **既存のリソース**
   - Resource Group
   - Virtual Network (VNet)
   - Azure Container Registry (オプション、プライベートレジストリを使用する場合)

## セットアップ手順

### 1. Terraform 変数の設定

```bash
# terraform.tfvars.example をコピー
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvars を編集
vi terraform.tfvars
```

必須の変数:
```hcl
subscription_id        = "your-subscription-id"
resource_group_name    = "rg-deploy-app-agent"
vnet_name              = "vnet-deploy-app-agent"
acr_name              = "acrdeployappagent"  # グローバルに一意な名前、英数字のみ
container_image        = "deploy-app-agent-api:latest"  # イメージ名とタグのみ
openai_api_key         = "sk-..."
aws_access_key_id      = "AKIA..."
aws_secret_access_key  = "..."
```

### 2. Terraform の実行

```bash
# 初期化
terraform init

# プランの確認（7リソースが作成されます）
terraform plan

# 適用（ACR、VNet、NSG、Subnet、ACI が作成されます）
terraform apply

# ACR ログイン情報を取得
terraform output acr_login_server
terraform output -raw acr_admin_username
terraform output -raw acr_admin_password

# outputs の確認
terraform output
```

### 3. Docker イメージのビルドとプッシュ

```bash
# ACR にログイン
ACR_SERVER=$(terraform output -raw acr_login_server)
ACR_USERNAME=$(terraform output -raw acr_admin_username)
ACR_PASSWORD=$(terraform output -raw acr_admin_password)

echo $ACR_PASSWORD | docker login $ACR_SERVER --username $ACR_USERNAME --password-stdin

# イメージをビルド（amd64 アーキテクチャ）
cd ../../sample
docker build --platform linux/amd64 -t deploy-app-agent-api:latest .

# ACR にタグ付けしてプッシュ
docker tag deploy-app-agent-api:latest ${ACR_SERVER}/deploy-app-agent-api:latest
docker push ${ACR_SERVER}/deploy-app-agent-api:latest
```

### 4. Container Instance の再起動（イメージ更新を反映）

```bash
# Container Instance を削除して再作成
cd ../../setup/azure
terraform apply -replace="azurerm_container_group.api"

# または Terraform で再度 apply（自動的に更新されます）
terraform apply
```

## デプロイ後の確認

### 1. Container Instance のステータス確認

```bash
# Azure Portal で確認
# または CLI で確認:
az container show \
  --resource-group rg-deploy-app-agent \
  --name aci-deploy-app-agent \
  --query "{Status:instanceView.state, IP:ipAddress.ip}" \
  --output table
```

### 2. VNet 内の VM からアクセステスト

```bash
# VNet 内の VM にログインして実行
PRIVATE_IP=$(terraform output -raw container_private_ip)

# Health check
curl http://${PRIVATE_IP}:3001/api/health

# Generate endpoint test
curl -X POST http://${PRIVATE_IP}:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a simple hello world app",
    "workspaceDir": "/tmp/test",
    "maxIterations": 5
  }'
```

### 3. ログの確認

```bash
# コンテナログの確認
az container logs \
  --resource-group rg-deploy-app-agent \
  --name aci-deploy-app-agent \
  --container-name deploy-app-agent-api

# リアルタイムログの確認
az container attach \
  --resource-group rg-deploy-app-agent \
  --name aci-deploy-app-agent
```

## トラブルシューティング

### コンテナが起動しない

```bash
# 詳細なステータス確認
az container show \
  --resource-group rg-coding-agent-dev \
  --name aci-coding-agent-dev

# イベントログの確認
az container show \
  --resource-group rg-coding-agent-dev \
  --name aci-coding-agent-dev \
  --query "instanceView.events[]"
```

### ネットワーク接続の問題

```bash
# NSG ルールの確認
az network nsg show \
  --resource-group rg-coding-agent-dev \
  --name nsg-aci-dev

# サブネットの確認
az network vnet subnet show \
  --resource-group rg-coding-agent-dev \
  --vnet-name vnet-coding-agent \
  --name snet-aci-dev
```

### イメージのプル失敗 (Private Registry)

```bash
# レジストリ認証情報の確認
az acr credential show --name yourregistryname

# Container Instance にレジストリアクセス権限があるか確認
# terraform.tfvars で正しい認証情報が設定されているか確認
```

## コスト管理

Azure Container Instances の料金は以下に基づきます:
- vCPU: 1.0 コア
- メモリ: 2.0 GB
- 実行時間

```bash
# コンテナの停止 (課金停止)
az container stop \
  --resource-group rg-coding-agent-dev \
  --name aci-coding-agent-dev

# コンテナの開始
az container start \
  --resource-group rg-coding-agent-dev \
  --name aci-coding-agent-dev
```

## クリーンアップ

```bash
# Terraform でリソース削除
terraform destroy

# または個別に削除
az container delete \
  --resource-group rg-coding-agent-dev \
  --name aci-coding-agent-dev \
  --yes
```

## セキュリティ考慮事項

1. **プライベートアクセスのみ**: パブリック IP は割り当てられていません
2. **NSG**: VNet 内からのアクセスのみ許可
3. **シークレット管理**: 機密情報は secure_environment_variables として保存
4. **TLS/SSL**: 必要に応じて Application Gateway や Azure Front Door を追加

## 次のステップ

- Azure Application Gateway を追加して TLS 終端を実装
- Azure Monitor で監視とアラートを設定
- Azure Key Vault でシークレット管理を改善
- CI/CD パイプラインの構築 (GitHub Actions / Azure DevOps)
