# Azure Bastion VM for Private Network Access

このディレクトリには、既存のプライベートVNet内のリソース（ACI）にアクセスするためのBastion VMを構築するTerraformコードが含まれています。

## アーキテクチャ

```
Internet
    |
    | SSH (Port 22)
    v
[Bastion VM (10.2.1.x)]
    |
    | VNet Peering
    v
[App VNet (10.1.0.0/16)]
    |
    +-- [ACI: 10.1.1.4] (Private API)
```

## 特徴

- **安価な構成**: Standard_B1s VM（月額約$8-10）
- **VNet Peering**: 既存のアプリVNetと接続
- **Ubuntu 22.04 LTS**: curl等の基本ツールがプリインストール
- **Public IP**: SSH接続用のパブリックIPアドレス
- **NSG**: SSH（ポート22）のみ許可

## 前提条件

1. Azure CLI がインストールされ、ログイン済みであること
2. SSH公開鍵が `~/.ssh/id_rsa.pub` に存在すること
3. 既存のVNet `vnet-coding-agent` がリソースグループ `rg-deploy-app-demo` に存在すること

## 使用方法

### 1. SSH鍵の作成

このフォルダ内に専用のSSH鍵を作成：

```bash
ssh-keygen -t rsa -b 4096 -f bastion_key -N "" -C "azure-bastion-vm"
```

### 2. Terraformの実行

```bash
# 初期化
terraform init

# プラン確認
terraform plan

# リソース作成
terraform apply
```

### 3. Bastion VMに接続

```bash
# 出力されたSSHコマンドを使用（秘密鍵を指定）
ssh -i bastion_key azureuser@<BASTION_PUBLIC_IP>

# または terraform output で確認
terraform output ssh_command
```

### 4. プライベートAPIへのアクセステスト

Bastion VMにSSH接続後：

```bash
# Health APIのテスト
curl http://10.1.1.4:3001/api/health

# Generate APIのテスト
curl -X POST http://10.1.1.4:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a simple Next.js app"}'
```

## 作成されるリソース

1. **Resource Group**: rg-deploy-app-bastion
2. **Virtual Network**: vnet-deploy-app-bastion (10.2.0.0/16)
3. **Subnet**: snet-deploy-app-bastion (10.2.1.0/24)
4. **Network Security Group**: nsg-deploy-app-bastion (SSH許可ルール)
5. **Public IP**: pip-deploy-app-bastion
6. **Network Interface**: nic-deploy-app-bastion
7. **Linux Virtual Machine**: vm-deploy-app-bastion (Ubuntu 22.04 LTS, Standard_B1s)
8. **VNet Peering**: 双方向（Bastion ↔ App VNet）

## コスト

概算月額コスト（Japan Eastリージョン）：
- VM (Standard_B1s): ~$8-10/月
- Public IP: ~$3/月
- VNet Peering: データ転送量に応じて（テスト用途なら数ドル以内）
- **合計**: ~$12-15/月

## クリーンアップ

```bash
terraform destroy
```

## セキュリティに関する注意

- このBastion VMはSSH（ポート22）が**インターネットに公開**されます
- 本番環境では、以下を推奨します：
  - Azure Bastion サービスの使用
  - NSGでSSH接続元IPを制限
  - Just-In-Time (JIT) VMアクセスの有効化
  - SSH鍵認証のみを許可（パスワード認証無効）

## トラブルシューティング

### SSH接続できない

```bash
# Public IPの確認
terraform output bastion_public_ip

# NSGルールの確認
az network nsg show \
  --resource-group rg-deploy-app-bastion \
  --name nsg-deploy-app-bastion
```

### プライベートネットワークに接続できない

```bash
# VNet Peeringの状態確認
az network vnet peering list \
  --resource-group rg-deploy-app-bastion \
  --vnet-name vnet-deploy-app-bastion

# ルートテーブルの確認
az network nic show-effective-route-table \
  --resource-group rg-deploy-app-bastion \
  --name nic-deploy-app-bastion
```

### API接続テストができない

```bash
# Bastion VMからpingテスト（ICMP）
ping 10.1.1.4

# ポート疎通確認
nc -zv 10.1.1.4 3001

# curlでverboseモード
curl -v http://10.1.1.4:3001/api/health
```
