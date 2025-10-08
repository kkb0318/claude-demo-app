# PC Caption Agent

クリーンアーキテクチャに準拠したPC画像分析エージェント

## 概要

このプロジェクトは、PCスクリーンショットをOpenAI APIで分析し、業務内容を推測する機能を提供します。
クリーンアーキテクチャの原則に従い、テスト駆動開発(TDD)とSOLID原則を重視して実装されています。

## アーキテクチャ

```
src/
├── domain/           # ビジネスロジック層（外部依存なし）
│   ├── entities/     # エンティティとスキーマ定義
│   ├── client/       # 外部クライアントのインターフェース
│   └── service/      # サービスのインターフェース
├── infrastructure/   # 外部依存実装層
│   ├── client/       # OpenAI APIクライアント実装
│   ├── config/       # 設定管理
│   ├── logger/       # ロギング実装
│   └── infrastructure-factory.ts  # 依存性注入ファクトリー
├── service/          # アプリケーションサービス層
│   └── analysis-service-impl.ts   # 分析サービス実装
└── example/          # 実行可能サンプル
    └── analyze-single-screenshot.example.ts
```

### 依存性の方向
```
Example → Service → Infrastructure → Domain
```

- **Domain層**: 外部依存ゼロ、TypeScript標準型 + Zodのみ使用
- **Infrastructure層**: 外部ライブラリ（OpenAI SDK、Winston等）の実装
- **Service層**: ビジネスロジックの実装
- **Example層**: 実行可能なサンプルコード

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、必要な値を設定します。

```bash
cp .env.example .env
```

`.env`ファイルを編集:

```env
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1500
OPENAI_TEMPERATURE=0.7
LOG_LEVEL=info
```

### 3. サンプル画像の配置

分析対象の画像を`data/`ディレクトリに配置します。

```
data/
└── KPI入力1.png
```

## 使用方法

### 単一画像分析の実行

```bash
npm run example:single
```

### テストの実行

#### ユニットテスト

```bash
npm test
```

#### ユニットテスト（watch モード）

```bash
npm run test:watch
```

#### カバレッジ付きテスト

```bash
npm run test:coverage
```

### ビルド

```bash
npm run build
```

## 実装済み機能

### 機能1: 単一画像分析機能（OpenAI連携）

- ✅ TDDによるテスト作成
- ✅ Domain層（エンティティ、インターフェース）
- ✅ Infrastructure層（OpenAIクライアント、Config、Logger）
- ✅ Service層（AnalysisServiceImpl）
- ✅ Example層（実行可能サンプル）
- ✅ Integration Test（統合テスト）
- ✅ Refactor（リファクタリング、カバレッジ確認）

#### テスト結果

- **ユニットテスト**: 12/12 passed
- **統合テスト**: 3/3 passed
- **カバレッジ**:
  - Entity層: 100%
  - Service層: 91.66%
  - 全体: 62.28%

## 開発原則

### TDD（テスト駆動開発）

1. **Red**: 失敗するテストを先に書く
2. **Green**: テストをパスする最小限のコードを実装
3. **Refactor**: コードを改善・最適化

### SOLID原則

- **S**ingle Responsibility Principle: 単一責任の原則
- **O**pen/Closed Principle: 開放/閉鎖の原則
- **L**iskov Substitution Principle: リスコフの置換原則
- **I**nterface Segregation Principle: インターフェース分離の原則
- **D**ependency Inversion Principle: 依存性逆転の原則

## プロジェクト構成

| ディレクトリ/ファイル | 説明 |
|---------------------|------|
| `src/domain/` | ビジネスロジック層（純粋なTypeScript） |
| `src/infrastructure/` | 外部依存実装層 |
| `src/service/` | アプリケーションサービス層 |
| `src/example/` | 実行可能サンプルコード |
| `tests/unit/` | ユニットテスト |
| `tests/integration/` | 統合テスト |
| `data/` | サンプルデータ |

## トラブルシューティング

### OpenAI APIキーが設定されていない

```
Error: OPENAI_API_KEY is required. Please set it in your .env file.
```

→ `.env`ファイルに`OPENAI_API_KEY`を設定してください。

### サンプル画像が見つからない

```
Error: 画像ファイルが見つかりません: /path/to/data/KPI入力1.png
```

→ `data/`ディレクトリに`KPI入力1.png`を配置してください。

## 今後の機能開発

- [ ] 機能2: 複数画像分析機能
- [ ] 機能3: 業務活動推論機能
- [ ] 機能4: Google Sheets記録機能
- [ ] 機能5: Google Sheets一括記録機能
- [ ] 機能6: Google Sheets統計取得機能
- [ ] 機能7: エンドツーエンド統合機能

詳細は`TODO.md`を参照してください。

## ライセンス

MIT
