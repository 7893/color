# Color

Interactive color palette generator with GPU-accelerated animations.

Last updated: September 17, 2026.

### Safe snapshot deployment

Set `TURNSTILE_SECRET` with `wrangler secret put TURNSTILE_SECRET` and configure
`SNAPSHOT_RATE_LIMITER` before enabling writes. Missing or unavailable protection
returns 503. The binding permits five attempts per client IP per minute per
Cloudflare location; it is abuse mitigation, not a global spending guarantee.
Snapshots remain a shared rolling sample of 1,024 records, not private user storage.
Request bodies are limited to 10 KiB while reading the stream.

Set the public `VITE_TURNSTILE_SITE_KEY` for your own hostname before building
(`.env` locally, repository variable of the same name in GitHub Actions). Keep the
matching secret in Worker secrets only; never expose it through a `VITE_` variable.
