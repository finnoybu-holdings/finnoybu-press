# finnoybu-press

The Finnoybu Press storefront — press.finnoybu.org. Astro 5 on Cloudflare
Pages, with Better Auth (magic-link only) on D1, paid downloads streamed
from R2, and Stripe Checkout for purchases.

## Stack

| Layer | Tech |
|---|---|
| Framework | Astro 5 (`@astrojs/cloudflare`) |
| Hosting | Cloudflare Pages |
| Database | Cloudflare D1 (SQLite) via Drizzle ORM |
| File storage | Cloudflare R2 (PDFs/EPUBs for paid downloads) |
| Auth | Better Auth — magic-link only, no passwords, no OAuth |
| Email | AWS SES via SigV4 (aws4fetch, Workers-compatible) |
| Payments | Stripe Checkout + webhook |

## First-time setup

These steps create the Cloudflare resources and wire up secrets. Run once
per Cloudflare environment (e.g. once for prod). Replace placeholders.

```sh
# 1. Install
npm install            # use npm run lock:wsl on Windows to regenerate lockfile

# 2. Create D1 database (returns a database_id — paste into wrangler.toml)
wrangler d1 create finnoybu-press

# 3. Create R2 bucket
wrangler r2 bucket create finnoybu-press-pdfs

# 4. Apply schema
npm run db:migrate:prod

# 5. Upload a PDF/EPUB (one-time per book; rerun when a book updates)
wrangler r2 object put finnoybu-press-pdfs/<slug>/<slug>.pdf  --file=output/digital/<slug>/<slug>.pdf
wrangler r2 object put finnoybu-press-pdfs/<slug>/<slug>.epub --file=output/digital/<slug>/<slug>.epub

# 6. Set production secrets in the Cloudflare dashboard:
#    Pages → finnoybu-press → Settings → Environment variables
#    (BETTER_AUTH_SECRET, AWS_*, EMAIL_FROM, STRIPE_*, PUBLIC_SITE_URL)
```

## Local dev

```sh
npm run dev               # astro dev — runs without D1/R2; auth no-ops
npm run pages:preview     # wrangler pages dev (full Workers runtime + D1/R2)
```

In `astro dev`, sign-in is no-op (no D1, no SES). To exercise auth locally,
use `pages:preview` after running `npm run db:migrate:local` once.

## Database migrations

Drizzle schema lives at `src/db/schema.ts`. To add or change tables:

```sh
# 1. Edit src/db/schema.ts
# 2. Generate a migration file
npm run db:generate
# 3. Apply locally to test
npm run db:migrate:local
# 4. Apply to production
npm run db:migrate:prod
```

## Cutover from Vercel/Supabase

The site was previously hosted on Vercel with Supabase auth + database. The
migration to Cloudflare is in this branch's history. The Vercel project
remains live until DNS is flipped:

1. Deploy this branch to Cloudflare Pages, get a `*.pages.dev` preview URL.
2. Smoke test: sign-in, checkout (test mode), download, sign-out.
3. In the domain registrar (or wherever `finnoybu.org`'s DNS lives), point
   `press.finnoybu.org` CNAME at `finnoybu-press.pages.dev`.
4. Once DNS propagates and the new site responds, delete the Vercel project.

## Image optimization

We don't run an on-demand image optimizer in production (Vercel's optimizer
isn't available on Cloudflare). `next/image` style optimization is replaced
by pre-built variants. The OG-card build script (`scripts/og/build-og.mjs`)
uses `sharp` and produces optimized output during build.

## Environment variables

See `.env.example` for the full list. Local development reads from `.env`;
production reads from the Cloudflare dashboard.
