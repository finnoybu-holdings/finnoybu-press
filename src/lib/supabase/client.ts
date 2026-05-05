import { createBrowserClient } from '@supabase/ssr';

let cached: ReturnType<typeof createBrowserClient> | null = null;

// Explicit cookie storage — without this, @supabase/ssr in some
// environments (Brave, certain Astro builds, etc.) silently falls back
// to localStorage for the auth token. localStorage is invisible to the
// server, so the server-side createServerClient never sees the session
// and getUser() returns "Auth session missing".
//
// By passing concrete getAll/setAll methods that read/write
// document.cookie, the session lands in real cookies that the browser
// sends to the server on every request, and our middleware + server
// client can see the user.
export function getBrowserClient() {
  if (cached) return cached;
  cached = createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return [];
          return document.cookie
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
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return;
          for (const { name, value, options } of cookiesToSet) {
            const parts: string[] = [`${name}=${encodeURIComponent(value)}`];
            const path = options?.path ?? '/';
            parts.push(`Path=${path}`);
            if (options?.maxAge !== undefined && options.maxAge !== null) {
              parts.push(`Max-Age=${options.maxAge}`);
            }
            if (options?.expires) {
              const exp = options.expires instanceof Date
                ? options.expires
                : new Date(options.expires as any);
              parts.push(`Expires=${exp.toUTCString()}`);
            }
            const sameSite = options?.sameSite ?? 'lax';
            parts.push(`SameSite=${sameSite}`);
            if (options?.secure || window.location.protocol === 'https:') {
              parts.push('Secure');
            }
            document.cookie = parts.join('; ');
          }
        },
      },
    }
  );
  return cached;
}
