# Color Palette Generator

Interactive color palette generator with hardware-accelerated WebGL animations.

## Features

- 🎨 Random color palette generation
- ✨ Hardware-accelerated WebGL background animations
- 📱 Responsive design (mobile, tablet, desktop)
- 🔒 Rate-limited API with security protections
- 💾 Automatic snapshot saving
- 📋 Click to copy color codes

## Tech Stack

- **Frontend**: Vanilla JavaScript, WebGL, Vite
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages

## Development

### Prerequisites

- Node.js 20+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Local Cloudflare Workers Development

```bash
# Run Workers locally
pnpm cf:dev
```

## Deployment

### Environment Variables

Set these secrets in your Cloudflare account or GitHub repository:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

### Database Setup

1. Create D1 database:
```bash
wrangler d1 create color-snapshots
```

2. Run migrations:
```bash
wrangler d1 execute color-snapshots --file=./schema.sql
```

3. Update `wrangler.toml` with your database ID

### Deploy

```bash
# Manual deployment
pnpm deploy

# Or push to main branch for automatic deployment via GitHub Actions
git push origin main
```

## Configuration

Edit `wrangler.toml` to configure:

- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS

## Project Structure

```
├── public/          # Static HTML
├── src/
│   ├── app/         # Main application logic
│   ├── config/      # Configuration constants
│   ├── data/        # Color data
│   ├── services/    # API services
│   ├── styles/      # CSS styles
│   └── utils/       # Utility functions
├── worker/          # Cloudflare Workers backend
├── docs/            # Documentation
└── schema.sql       # Database schema
```

## API

### POST /api/snapshots

Save a color palette snapshot.

**Rate Limits:**
- 3 requests per second
- 1000 requests per day (real IP)
- 10000 requests per day (unknown IP)

## License

MIT

