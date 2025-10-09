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
- `pnpm agent "<task description>"` — CLI版: Codex を用いた自動コーディングエージェント体験。

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

#### API機能

- ✅ **バリデーション**: Zodスキーマによるリクエスト検証
- ✅ **エラーハンドリング**: 統一されたエラーレスポンス
- ✅ **セキュリティ**: Helmet, CORS による保護
- ✅ **ロギング**: リクエストの自動ログ出力
- ✅ **Clean Architecture**: プレゼンテーション層として実装
