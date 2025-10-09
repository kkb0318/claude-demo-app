# Codex Sample Prototype

このディレクトリは `INSTRUCTION.md` で定義されたガイドラインに従い、Codex SDK をクリーンアーキテクチャ構成およびTDDで使用するサンプルを提供します。

## セットアップ

1. 依存関係をインストールします。
   ```fish
   pnpm install
   ```
2. `.env` ファイルまたはシェル環境に `CODEX_API_KEY`（`OPENAI_API_KEY` でも可）を設定します。必要に応じて `CODEX_BASE_URL` を指定できます。

## 主なコマンド

- `pnpm test` — Vitest によるユニットテストとカバレッジ収集。
- `pnpm test:watch` — ウォッチモードでのテスト実行。
- `pnpm lint` — ESLint による静的解析。
- `pnpm format` / `pnpm format:write` — Prettier によるフォーマット検証／修正。
- `pnpm build` — TypeScript コンパイル。
- `pnpm start -- --prompt="Write a hello world script"` — CLIからCodex呼び出しサンプルを起動。

## アーキテクチャ概要

- **Domain**: 値オブジェクト (`CodexPrompt`, `CodexCompletion`) が入力／出力の制約を担保。
- **Application**: `GenerateCodexCompletionUseCase` がCodexスレッドとの対話を協調。
- **Infrastructure**: `CodexThreadService` と `CodexSdkClient` が Codex SDK の `startThread` / `resumeThread` API を抽象化。
- **Interfaces**: `cli-runner` と `index.ts` がCLIエントリポイントを提供。
- **Tests**: 各モジュール直下にユニットテストを併置し、`tests/integration` に統合テスト例を配置。

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
