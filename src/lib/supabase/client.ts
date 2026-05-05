import { createBrowserClient } from '@supabase/ssr';

// Mirrors fiction.finnoybu.com client.ts: pass a cookieOptions.domain
// when AUTH_COOKIE_DOMAIN is set, so cookies set client-side use the
// same domain the server reads/writes them at.
const COOKIE_DOMAIN = import.meta.env.PUBLIC_AUTH_COOKIE_DOMAIN;

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  if (cached) return cached;
  cached = createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    COOKIE_DOMAIN ? { cookieOptions: { domain: COOKIE_DOMAIN } } : undefined
  );
  return cached;
}
