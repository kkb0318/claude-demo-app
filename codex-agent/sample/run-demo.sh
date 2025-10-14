#!/bin/bash

# デモ実行用スクリプト
# Usage: ./run-demo.sh "your task description"

set -e

# 環境変数のチェック
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ Error: ANTHROPIC_API_KEY is not set"
  echo "Please set it with: export ANTHROPIC_API_KEY=your-key"
  exit 1
fi

# バケット名の生成（ユニークな名前が必要）
BUCKET_NAME="${BUCKET_NAME:-codex-demo-app-$(date +%s)}"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"

echo "🚀 Starting Codex Agent Demo"
echo "📦 Bucket: $BUCKET_NAME"
echo "🌏 Region: $AWS_REGION"
echo ""

# タスクの取得
TASK="${1:-create a simple calculator app}"

# 実行
PROVISION=true \
DEPLOY=true \
BUCKET_NAME="$BUCKET_NAME" \
AWS_REGION="$AWS_REGION" \
pnpm agent "$TASK"
