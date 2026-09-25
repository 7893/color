# Color

Interactive color palette generator with GPU-accelerated animations.

Last updated: September 26, 2026.

## Run with your own resources

Use Node.js 24.18.1 or newer and pnpm 11.19.0 (see `package.json`).
The public successor repository is https://github.com/7893/color-clean.

```sh
git clone https://github.com/7893/color-clean.git
cd color-clean
pnpm install --frozen-lockfile
```

The animated palette is a browser UI. Saving or loading snapshots also needs the
Worker and its D1 binding; a Vite-only session is not a complete snapshot backend.

### Local snapshot backend

1. Create a Turnstile widget for your own hostname, including `localhost` if you
   will use it locally. Replace the public `TURNSTILE_SITEKEY` constant in
   `src/services/api.js` with that widget's site key. This version uses a source
   constant, not a `VITE_*` environment variable. Never put the secret key there.
2. Copy `.dev.vars.example` to `.dev.vars` and set the matching `TURNSTILE_SECRET`.
3. Initialize a new local D1 database, build assets, and start the local Worker:

```sh
cp .dev.vars.example .dev.vars
# Edit .dev.vars before starting the Worker.
pnpm exec wrangler d1 execute color-snapshots --local --file=schema.sql
pnpm build
pnpm cf:dev
# Open http://localhost:8787
```

Apply `schema.sql` once to an empty database; it creates tables and indexes and is
not an idempotent migration. This local command does not access the maintainer's
database. Rebuild after changing the public site key. `.dev.vars` is ignored by Git.

### Deploy to your own Cloudflare account

Authenticate Wrangler with your own account, create a new D1 database with
`pnpm exec wrangler d1 create color-snapshots`, and replace `database_id` in
`wrangler.toml` with the returned ID. Choose your own Worker `name` and replace
`ALLOWED_ORIGINS` with your intended browser origins. The existing IDs and domains
describe the maintainer's deployment and must not be reused as your resource setup.

After reviewing the target configuration, initialize your new remote database
with `pnpm exec wrangler d1 execute color-snapshots --remote --file=schema.sql`.
Set the matching server-side secret using
`pnpm exec wrangler secret put TURNSTILE_SECRET`, then run `pnpm deploy` when you
intend to publish. These commands create resources or deploy only when you run
them; cloning and building do not deploy anything.

Snapshots store palette data and request metadata, including client IP and user
agent as defined in `schema.sql`. Decide what you intend to collect and retain
before enabling the feature on a public deployment.

## Contributor checks and deployment

`pnpm build` checks the frontend bundle. Public push/PR CI builds and performs a
Worker packaging dry run without Cloudflare credentials. Deployment is separate:
run the deployment workflow manually on `main` only after configuring your own
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, D1 binding and Worker secret.
The repository does not include production credentials or promise free cloud usage.
