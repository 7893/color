# Deployment Guide

## GitHub Actions Setup

1. Add secrets to your GitHub repository:
   - Go to Settings > Secrets and variables > Actions
   - Add `CLOUDFLARE_API_TOKEN`
   - Add `CLOUDFLARE_ACCOUNT_ID`

2. Push to main branch to trigger automatic deployment

## Manual Deployment

```bash
# Build and deploy
pnpm deploy

# Or step by step
pnpm build
wrangler deploy
```

## Local Development

```bash
# Start Vite dev server
pnpm dev

# Or test with Cloudflare Workers locally
pnpm cf:dev
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

## Database Setup

Initialize D1 database:

```bash
wrangler d1 execute color-snapshots --file=schema.sql
```
