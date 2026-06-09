/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

type Runtime = import('@astrojs/cloudflare').Runtime;

// Augment cloudflare:workers to expose typed env bindings (Astro v6 / adapter v13+)
declare module 'cloudflare:workers' {
  const env: Env;
  export { env };
}

interface Env {
  // Cloudflare bindings (wrangler.toml)
  DB: D1Database;
  PDFS: R2Bucket;

  // Better Auth
  BETTER_AUTH_SECRET: string;

  // Outbound email (AWS SES via SigV4)
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  EMAIL_FROM?: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  // Site config
  PUBLIC_SITE_URL?: string;
}

declare namespace App {
  interface Locals extends Runtime {
    // Set by middleware on every non-prerendered request.
    user: {
      id: string;
      email: string;
      name: string | null;
    } | null;
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
