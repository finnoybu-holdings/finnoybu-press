import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

// No cookie domain — let Supabase's browser client and the server use
// defaults (current host = press.finnoybu.org). A domain attribute only
// matters for cross-subdomain auth, which we don't have. Setting it
// asymmetrically (server adds domain, browser doesn't) creates two
// cookies with the same name and intermittent auth failures.

export function createClient(cookies: AstroCookies) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          // During static prerender (`prerender = true`), Astro passes a
          // cookies stub that lacks .getAll(). Treat that as "no cookies"
          // so a session lookup just returns no user, instead of throwing.
          if (typeof cookies?.getAll !== 'function') return [];
          return cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet) {
          if (typeof cookies?.set !== 'function') return;
          for (const { name, value, options } of cookiesToSet) {
            cookies.set(name, value, options as any);
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
