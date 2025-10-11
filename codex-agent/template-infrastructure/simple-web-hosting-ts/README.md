# Simple Web Hosting with CDKTF

AWS S3 + CloudFront による静的Webホスティング（CDKTF/TypeScript実装）

## Prerequisites

- Node.js v16.13+
- pnpm
- Terraform CLI v1.2+
- AWS CLI with profile `agent-galaxy`

## Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your values
```

## Configuration

Edit `.env`:
```bash
BUCKET_NAME=your-unique-bucket-name
AWS_REGION=ap-northeast-1
ENVIRONMENT=dev
RESOURCE_PREFIX=myproject-
```

## Usage

```bash
# Deploy
pnpm run deploy

# Preview changes
pnpm run plan

# Destroy
pnpm run destroy
```

## Features

- AWS S3 static hosting
- CloudFront CDN
- Origin Access Control (OAC)
- Terraform state in S3 (`agent-galaxy-tfstate-storage`)
- TypeScript-based infrastructure management
