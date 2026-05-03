import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const COOKIE_DOMAIN = import.meta.env.AUTH_COOKIE_DOMAIN || undefined;

export function createClient(cookies: AstroCookies) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            const opts: CookieOptions & { domain?: string } = { ...options };
            if (COOKIE_DOMAIN) opts.domain = COOKIE_DOMAIN;
            cookies.set(name, value, opts as any);
          }
        },
      },
    }
  );
}

// Service-role client — server-side only. Bypasses RLS. Use sparingly
// (currently: webhook handler inserting purchase rows).
export function createServiceClient() {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SECRET_KEY,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
}
