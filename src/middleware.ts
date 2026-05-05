import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from '@supabase/ssr';

// Read cookies via the raw header so we don't depend on
// AstroCookies.getAll being available — it isn't in some
// Astro/adapter contexts and that was silently breaking auth.
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

export const onRequest = defineMiddleware(async ({ cookies, locals, request }, next) => {
  try {
    if (!import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
      return next();
    }

    const supabase = createServerClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return parseCookieHeader(request.headers.get('cookie'));
          },
          setAll(cookiesToSet) {
            if (!cookies || typeof cookies.set !== 'function') return;
            for (const { name, value, options } of cookiesToSet) {
              try {
                cookies.set(name, value, options as any);
              } catch {
                // headers may already be sent on streamed responses
              }
            }
          },
        },
      }
    );

    try {
      const { data } = await supabase.auth.getUser();
      (locals as any).user = data.user ?? null;
    } catch {
      (locals as any).user = null;
    }
  } catch (err) {
    console.error('[middleware] supabase init failed:', err);
  }

  return next();
});
