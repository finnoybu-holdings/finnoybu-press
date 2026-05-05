# Commerce Setup

Complete steps to get the Finnoybu Press commerce stack live. Mirrors the fiction trilogy approach (Supabase Auth + Stripe Checkout + files in `output/`), adapted for Astro.

---

## 1. Install dependencies

```
npm install
```

New packages: `@astrojs/vercel`, `@supabase/ssr`, `@supabase/supabase-js`, `stripe`.

## 2. Create the Supabase project

1. Go to **supabase.com** → New Project. Name it `finnoybu-press` (separate from fiction).
2. Copy the **Project URL**, **Anon (public) key**, and **Service role (secret) key** into `.env.local` (see `.env.example`):

   ```
   PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SECRET_KEY=eyJ...
   ```

3. Open the **SQL Editor** → paste and run `migrations/001_purchases.sql`.

## 3. Configure Supabase Auth providers

Supabase Dashboard → **Authentication** → **Providers**.

For each of the four social providers, create an OAuth app on the provider's developer portal, then paste the client ID and secret into Supabase. Redirect URI for all four is:

```
https://YOUR-PROJECT.supabase.co/auth/v1/callback
```

- **Google** — Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application). Authorized redirect URIs: the Supabase callback above.
- **Apple** — Apple Developer Portal → Identifiers → Services IDs. Generate a key under Keys (with Sign in with Apple enabled). Use the `apple:secret` script pattern from the fiction repo if you need to mint the JWT.
- **GitHub** — GitHub → Settings → Developer settings → OAuth Apps → New OAuth App. Authorization callback URL: the Supabase callback above.
- **Facebook** — Meta for Developers → Create App → Facebook Login → Settings. Valid OAuth Redirect URIs: the Supabase callback above.

Email/password is enabled by default (Supabase → Authentication → Providers → Email).

## 4. Configure Supabase site URL and redirects

Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: `https://press.finnoybu.org`
- **Redirect URLs** (allowlist; one per line):
  ```
  http://localhost:4321/auth/callback
  https://press.finnoybu.org/auth/callback
  https://*.vercel.app/auth/callback
  ```

## 5. Configure Stripe

Use the same Stripe account as fiction/AEGIS.

1. Stripe Dashboard → **Developers** → **API keys**. Copy the **Secret key** (`sk_live_...` for production, `sk_test_...` for dev) into `.env.local` as `STRIPE_SECRET_KEY`.
2. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**.
   - Endpoint URL: `https://press.finnoybu.org/api/webhook`
   - Events to send: `checkout.session.completed`
   - After creation, copy the **Signing secret** (`whsec_...`) into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

For local dev, use the Stripe CLI to forward webhooks to your dev server:

```
stripe login
stripe listen --forward-to http://localhost:4321/api/webhook
```

The CLI prints a webhook secret — use that as `STRIPE_WEBHOOK_SECRET` in `.env.local` while developing.

## 6. Set production env vars in Vercel

Vercel project → **Settings** → **Environment Variables**. Add all variables from `.env.example` with production values.

Set `AUTH_COOKIE_DOMAIN=.finnoybu.org` for production so cookies work across `press.finnoybu.org` and any other `*.finnoybu.org` subdomain. Leave it unset (or empty) for local dev.

Set `PUBLIC_SITE_URL=https://press.finnoybu.org` for production.

## 7. Add digital files

Each book's PDF and ePub belong at:

```
output/digital/<book-slug>/<book-slug>.pdf
output/digital/<book-slug>/<book-slug>.epub
```

These files are auth-gated — served only via `/api/download/[slug]` after a purchase check. They're NOT in `public/` (would be world-readable).

**Important:** For files to be available in production, they must be bundled into the Vercel serverless function. In `astro.config.mjs`, update the `includeFiles` array on the Vercel adapter to list each file explicitly:

```js
adapter: vercel({
  includeFiles: [
    './output/digital/notebooklm/notebooklm.pdf',
    './output/digital/notebooklm/notebooklm.epub',
    './output/digital/deepseek/deepseek.pdf',
    './output/digital/deepseek/deepseek.epub',
    // ... add an entry per file as books ship
  ],
}),
```

The adapter's path resolution doesn't tolerate non-existent globs, so paths must be enumerated explicitly. Add entries as books complete the build pipeline.

For books without digital files yet, the download endpoint returns 404 cleanly.

## 8. Verify

Local:

```
npm run dev
```

- Visit `/` — page loads, Nav shows "Sign in" button + cart icon
- Click "Sign in" — modal opens, OAuth + email/password options visible
- Sign up with email/password, confirm via email, sign in
- Add a book to cart from a book page
- Visit `/cart`, click "Proceed to checkout"
- Complete a Stripe test checkout (use card `4242 4242 4242 4242`)
- Get redirected to `/shop/success`
- Visit `/account` — book appears in your library
- Click Download PDF / ePub — file downloads (or 404 if file isn't yet in `output/digital/<slug>/`)

Build:

```
npm run build
```

Should complete cleanly. Static pages (home, books, collections, about, etc.) are prerendered; cart/account/shop/api routes are server-rendered via the Vercel adapter.

## Architecture summary

| Layer | Implementation |
|---|---|
| Auth | Supabase Auth (email/password + Google/Apple/Facebook/GitHub) via `@supabase/ssr` |
| Cart | Client-side, persisted in `localStorage` (key: `fp-cart`) |
| Checkout | Stripe Checkout Session (one session, N line items per cart) |
| Webhook | `checkout.session.completed` → upsert into `purchases` table |
| Downloads | Auth-gated server route streams files from `output/digital/<slug>/` |
| Account | Server-rendered library reading from `purchases` joined with content collection |

## What's NOT here (yet)

- **Cart-restoration after sign-in** — the modal currently reloads the page after sign-in, which preserves localStorage cart. If we move to a SPA-style auth flow later, we'll need to be more deliberate.
- **R2 / signed URLs** — files served from local Vercel filesystem. Move to R2 if files exceed a few MB or if you want CDN edge caching.
- **Refunds / order management** — view-only library; no UI for reversing purchases. Handle via Stripe dashboard for now.
- **Receipt customization** — using Stripe's default receipt email. Customize in Stripe → Settings → Branding.
- **Discount codes / promotions** — can be added via Stripe Coupons later.
