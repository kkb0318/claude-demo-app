# Codex Sample Prototype

このディレクトリは `INSTRUCTION.md` で定義されたガイドラインに従い、Codex SDK をクリーンアーキテクチャ構成およびTDDで使用するサンプルを提供します。

## セットアップ

1. 依存関係をインストールします。
   ```fish
   pnpm install
   ```
2. `.env` ファイルまたはシェル環境に `CODEX_API_KEY`（`OPENAI_API_KEY` でも可）を設定します。必要に応じて `CODEX_BASE_URL` を指定できます。

## 主なコマンド

### Development & Testing
- `pnpm test` — Vitest によるユニットテストとカバレッジ収集。
- `pnpm test:watch` — ウォッチモードでのテスト実行。
- `pnpm lint` — ESLint による静的解析。
- `pnpm format` / `pnpm format:write` — Prettier によるフォーマット検証／修正。
- `pnpm build` — TypeScript コンパイル。

### CLI Mode

#### アプリケーション生成 & デプロイ
```fish
# 基本的な使用方法（コード生成のみ）
pnpm agent "create a simple todo app"

# CloudFrontへのフルデプロイ
PROVISION=true DEPLOY=true \
  BUCKET_NAME="my-app-$(date +%s)" \
  AWS_REGION="ap-northeast-1" \
  pnpm agent "create a hello world app"
```

**環境変数:**
- `PROVISION=true` - AWS インフラ（S3 + CloudFront）のプロビジョニングを有効化
- `DEPLOY=true` - S3へのデプロイを有効化
- `BUCKET_NAME` - 使用するS3バケット名
- `AWS_REGION` - AWSリージョン（デフォルト: ap-northeast-1）
- `AWS_PROFILE` - 使用するAWSプロファイル（デフォルト: agent-galaxy）

#### インフラストラクチャの削除
```fish
# 作成したAWSリソースを削除
BUCKET_NAME="my-app-1234567890" \
  AWS_REGION="ap-northeast-1" \
  pnpm destroy

# ワークスペースディレクトリを指定する場合（Terraformの状態ファイルがある場合）
WORKSPACE_DIR="/var/folders/.../coding-agent-demo-abc123" \
  BUCKET_NAME="my-app-1234567890" \
  pnpm destroy
```


### API Server Mode
- `pnpm api` — REST API サーバーの起動 (ポート: 3001)
- `pnpm api:dev` — 開発モード (ホットリロード付き)

## アーキテクチャ概要 (Clean Architecture)

本プロジェクトはクリーンアーキテクチャに準拠し、以下の層構造で構成されています:

### Domain Layer
- **Entities**: `CodexPrompt`, `CodexCompletion` - ビジネスルールとバリデーションを持つドメインエンティティ

### Application Layer
- **Services**: `CodingAgentRunner` - Codexを用いた計画→編集→検証ループの自動化
- **Ports**: インターフェース定義 (Dependency Inversion Principle)
  - `CodexThreadRunner` - Codex実行の抽象化
  - `AgentWorkspace` - ワークスペース操作の抽象化
  - `CommandRunner` - コマンド実行の抽象化

### Infrastructure Layer
- **Adapters**: 
  - `CodexThreadService` - Codex SDK の実装
  - `CodexSdkClient` - Codex SDK クライアントのラッパー
- **System**:
  - `FileSystemWorkspace` - ファイルシステム操作の実装
  - `ShellCommandRunner` - 安全なシェルコマンド実行
- **Config**: `createCodexClient` - Codex設定の初期化

### Presentation Layer
- **CLI**: `coding-agent.ts` - コマンドラインインターフェース
- **API** (NEW):
  - **Controllers**: `CodingAgentController` - HTTPリクエスト処理
  - **Routes**: REST APIエンドポイント定義
  - **Middlewares**: エラーハンドリング、バリデーション、ロギング
  - **DTOs**: リクエスト/レスポンスのデータ転送オブジェクト

### Tests
- 各モジュール直下にユニットテストを併置
- API統合テストを `presentation/api/*.spec.ts` に配置
- カバレッジ目標: Statements 90%, Branches 85%, Functions 90%

## 実行例

```fish
pnpm start -- --prompt="List three SOLID principles"
# 既存スレッドを再利用する場合
pnpm start -- --prompt="Continue the investigation" --thread=<thread-id>
```

成功すると、Codexから取得したテキストが標準出力に表示され、スレッドIDも併せて出力されます。

## 追加メモ

- 公式Codex SDKの型定義をそのまま使用し、`CodexSdkInterface` でアプリケーション層と接続しています。
- CLIはエラー発生時にexit code `1` を返し、標準エラー出力へ詳細を表示します。

## 使い方

### 1. CLI Mode - Coding Agent

`CodingAgentRunner` は以下のステップを自動で繰り返し、`finish` アクションが返るまで継続します:

1. タスク説明、ファイルリスト、過去のやり取りをCodexへ提示
2. Codexから返却されたJSONアクションを安全に解析し、ファイル編集・許可コマンド実行・ログ出力を実施
3. 実行結果や標準出力をフィードバックとして再びCodexに渡し、次のアクションを取得

```fish
pnpm agent "Create a TODO app with React and TypeScript"
```

デフォルトで8イテレーションまで繰り返します。実行ログやコマンド結果は標準出力に逐次表示されます。

### 2. API Server Mode (NEW)

REST APIとして起動し、HTTPリクエスト経由でアプリ生成を実行できます。

#### サーバー起動

```fish
# 通常起動
pnpm api

# 開発モード (ホットリロード)
pnpm api:dev
```

サーバーは `http://localhost:3001` で起動します。

#### API Endpoints

##### Health Check
```bash
curl http://localhost:3001/api/health
```

**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "timestamp": "2025-10-09T14:54:16.927Z"
}
```

##### Generate Application
```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a calculator app with React",
    "maxIterations": 8
  }'
```

**Request Body:**
```typescript
{
  prompt: string;          // Required: 1-4000文字のタスク説明
  maxIterations?: number;  // Optional: 最大イテレーション数 (デフォルト: 8)
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Application generated successfully",
  "workspaceId": "/tmp/coding-agent-demo-abc123",
  "summary": "Created a calculator app with React and TypeScript",
  "iterations": 5
}
```

**Response (Error):**
```json
{
  "error": "Validation Error",
  "message": "Prompt is required",
  "statusCode": 400
}
```

##### Destroy Infrastructure
```bash
curl -X POST http://localhost:3001/api/infrastructure/destroy \
  -H "Content-Type: application/json" \
  -d '{
    "bucketName": "demo-app-1760359834",
    "awsRegion": "ap-northeast-1",
    "workspaceDir": "/var/folders/bg/w243fwkn2bd2c8r0xmd_dtvh0000gn/T/coding-agent-demo-FWEsF2"
  }'
```

**Request Body:**
```typescript
{
  bucketName: string;    // Required: S3バケット名
  awsRegion: string;     // Required: AWSリージョン (例: ap-northeast-1)
  workspaceDir: string;  // Required: Terraformステートファイルが保存されているワークスペースディレクトリ
  awsProfile?: string;   // Optional: AWSプロファイル (デフォルト: agent-galaxy)
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Infrastructure destroyed successfully"
}
```

**Response (Error - Validation):**
```json
{
  "success": false,
  "message": "bucketName must contain only lowercase letters, numbers, and hyphens"
}
```

**Response (Error - Infrastructure):**
```json
{
  "success": false,
  "message": "Failed to destroy CloudFront distribution"
}
```

#### API機能

- ✅ **バリデーション**: Zodスキーマによるリクエスト検証
- ✅ **エラーハンドリング**: 統一されたエラーレスポンス
- ✅ **セキュリティ**: Helmet, CORS による保護
- ✅ **ロギング**: リクエストの自動ログ出力
- ✅ **Clean Architecture**: プレゼンテーション層として実装

### 3. Docker Mode (NEW)

アプリケーションをDockerコンテナとして実行できます。

#### Docker イメージのビルド

```bash
docker build -t coding-agent-api:latest .
```

#### コンテナの起動

```bash
docker run -d \
  --name coding-agent-api \
  -p 3001:3001 \
  -e OPENAI_API_KEY="your-api-key" \
  -e AWS_ACCESS_KEY_ID="your-aws-access-key" \
  -e AWS_SECRET_ACCESS_KEY="your-aws-secret-key" \
  -e AWS_REGION="ap-northeast-1" \
  coding-agent-api:latest
```

#### Health Check

```bash
curl http://localhost:3001/api/health
```

詳細は [DOCKER.md](./DOCKER.md) を参照してください。

### 4. Azure Deployment (NEW)

Azure Container Instances を使用して、プライベートネットワーク内でAPIサーバーをデプロイできます。

#### 特徴
- ✅ **Private Access**: VNet内からのみアクセス可能（パブリックIPなし）
- ✅ **Container Instances**: サーバーレスコンテナ実行環境
- ✅ **Infrastructure as Code**: Terraform でインフラ管理
- ✅ **Health Probes**: Liveness/Readiness チェック
- ✅ **Secure Secrets**: 環境変数として安全に保存

#### デプロイ手順

```bash
cd ../setup/azure

# terraform.tfvars の設定
cp terraform.tfvars.example terraform.tfvars
vi terraform.tfvars

# インフラのデプロイ
terraform init
terraform plan
terraform apply
```

詳細は [setup/azure/README.md](../setup/azure/README.md) を参照してください。

完全な動作確認手順は [DEPLOYMENT_VERIFICATION.md](../DEPLOYMENT_VERIFICATION.md) を参照してください。
