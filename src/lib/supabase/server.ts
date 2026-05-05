import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

// Read cookies via the raw Cookie header on the request rather than
// AstroCookies.getAll(): some Astro/adapter combinations don't expose
// .getAll() on the API-route cookies object, which silently breaks
// server-side session lookup. The raw header is universal.
function parseCookieHeader(header: string | null) {
  if (!header) return [] as { name: string; value: string }[];
  return header
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const eq = c.indexOf('=');
      if (eq < 0) return { name: c, value: '' };
      return {
        name: c.slice(0, eq),
        value: decodeURIComponent(c.slice(eq + 1)),
      };
    });
}

export function createClient(cookies: AstroCookies, request?: Request) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          // Prefer reading from the raw request header — works regardless
          // of which Astro/adapter version is producing the cookies stub.
          if (request) return parseCookieHeader(request.headers.get('cookie'));
          // Fall back to AstroCookies.getAll if available (page rendering
          // contexts that don't pass request — pages typically have it).
          if (cookies && typeof (cookies as any).getAll === 'function') {
            try {
              return (cookies as any).getAll().map((c: any) => ({ name: c.name, value: c.value }));
            } catch {
              return [];
            }
          }
          return [];
        },
        setAll(cookiesToSet) {
          if (!cookies || typeof cookies.set !== 'function') return;
          for (const { name, value, options } of cookiesToSet) {
            try {
              cookies.set(name, value, options as any);
            } catch {
              // Astro can refuse to set cookies after headers have been
              // streamed. Swallow — page still works for this request.
            }
          }
        },
      },
    }
  );
}

// Service-role client — server-side only. Bypasses RLS.
export function createServiceClient() {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SECRET_KEY,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
}
