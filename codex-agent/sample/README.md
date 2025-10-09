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
- `pnpm agent "<task description>"` — Codex を用いた自動コーディングエージェント体験。
- `pnpm demo:agent` — スタブされたレスポンスでエージェントのフローを再現するローカルデモ。
- `pnpm start -- --prompt="Write a hello world script"` — CLIからCodex呼び出しサンプルを起動。

## アーキテクチャ概要

- **Domain**: 値オブジェクト (`CodexPrompt`, `CodexCompletion`) が入力／出力の制約を担保。
- **Application**: `GenerateCodexCompletionUseCase` がCodexスレッドとの対話を協調。
- **Application / Services**: `CodingAgentRunner` がCodexを用いて計画→編集→検証ループを自動化。
- **Infrastructure**: `CodexThreadService` と `CodexSdkClient` が Codex SDK の `startThread` / `resumeThread` API を抽象化。
- **Infrastructure / System**: `FileSystemWorkspace` と `ShellCommandRunner` がワークスペース操作と安全なコマンド実行を提供。
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

## Coding Agent モードの使い方

`CodingAgentRunner` は以下のステップを自動で繰り返し、`finish` アクションが返るまで継続します。

1. タスク説明、ファイルリスト、過去のやり取りをCodexへ提示。
2. Codexから返却されたJSONアクションを安全に解析し、ファイル編集・許可コマンド実行・ログ出力を実施。
3. 実行結果や標準出力をフィードバックとして再びCodexに渡し、次のアクションを取得。

実行例:

```fish
pnpm agent "Add input validation to the register CLI"
```

デフォルトで8イテレーションまで繰り返し、`AGENT_MAX_ITERATIONS` 環境変数で上限を調整できます。実行ログやコマンド結果は標準出力に逐次表示されます。

### オフラインデモ (`pnpm demo:agent`)

Codex API キーがなくても、`pnpm demo:agent` を実行すると、スタブした Codex 応答を使ったデモワークフローを再生できます。デモでは `demo-workspace/src/greet.ts` を生成し、「興奮フラグ」を追加する 2 イテレーションのプランを実行します。各イテレーションのプロンプト／レスポンス、擬似コマンド結果、最終的なファイル内容がコンソールに表示されるため、`CodingAgentRunner` の挙動を安全に確認できます。
