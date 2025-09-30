# PC Caption Analyzer

AIによるマルチモーダル推論を使用して、PCスクリーンショットと操作ログから業務活動を分析するシステムです。

## アーキテクチャ

- **フロントエンド**: Next.js 15 (App Router)、TypeScript、Tailwind CSS
- **バックエンド**: Express、TypeScript、OpenAI API
- **責務分離**: MVC (バックエンド) / UI・ロジック分離 (フロントエンド)

## セットアップ

### 1. 依存関係のインストール

```bash
# バックエンド
cd backend
npm install

# フロントエンド
cd ../frontend
npm install
```

### 2. 環境変数の設定

バックエンド (.env):
```
OPENAI_API_KEY=your-api-key
```

### 3. サーバーの起動

```bash
# バックエンド (ポート3001)
cd backend
npm run dev

# フロントエンド (ポート3000)
cd frontend
npm run dev
```

## 使用方法

1. http://localhost:3000 にアクセス
2. スクリーンショット（PNG/JPEG）をアップロード
3. オプション: 操作ログ（JSON）をアップロード
4. 「Analyze」ボタンをクリック
5. AI分析結果を確認

## API エンドポイント

- `POST /api/analysis/analyze` - スクリーンショット＋操作ログの統合分析
- `POST /api/analysis/analyze-screenshots` - スクリーンショットのみの分析

## 機能

- 📸 複数スクリーンショットの一括分析
- 📝 操作ログとの統合分析
- 🤖 OpenAI Vision APIによる画像認識
- 📊 業務活動の自動推論
- 💾 分析レポートのダウンロード