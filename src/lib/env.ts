import type { APIContext, AstroGlobal } from 'astro';

// Cloudflare Pages exposes env via Astro.locals.runtime.env. Local `astro dev`
// reads from .env via import.meta.env (PUBLIC_*) and process.env (server-only).
// This shim returns whichever source is populated so callsites stay simple.
export function getEnv(ctx: APIContext | AstroGlobal): Env {
  const runtimeEnv = (ctx.locals as App.Locals).runtime?.env as Env | undefined;
  if (runtimeEnv && runtimeEnv.DB) return runtimeEnv;

  const proc = (globalThis as any).process?.env ?? {};
  return {
    DB: undefined as unknown as D1Database,
    PDFS: undefined as unknown as R2Bucket,
    BETTER_AUTH_SECRET: proc.BETTER_AUTH_SECRET ?? '',
    AWS_ACCESS_KEY_ID: proc.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: proc.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: proc.AWS_REGION,
    EMAIL_FROM: proc.EMAIL_FROM,
    STRIPE_SECRET_KEY: proc.STRIPE_SECRET_KEY ?? '',
    STRIPE_WEBHOOK_SECRET: proc.STRIPE_WEBHOOK_SECRET ?? '',
    PUBLIC_SITE_URL:
      import.meta.env.PUBLIC_SITE_URL ??
      proc.PUBLIC_SITE_URL ??
      'http://localhost:4321',
  };
}

// True when D1 + Better Auth secret are both populated.
export function isAuthConfigured(env: Env): boolean {
  return Boolean(env.DB && env.BETTER_AUTH_SECRET);
}

// Resolve the site URL used for absolute links (canonical, OG, magic-link
// callbacks). Falls back to the request origin if nothing else is set.
export function getSiteUrl(ctx: APIContext | AstroGlobal): string {
  const env = getEnv(ctx);
  return env.PUBLIC_SITE_URL || ctx.url.origin;
}
