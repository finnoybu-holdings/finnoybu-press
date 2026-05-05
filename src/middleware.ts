import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from '@supabase/ssr';

// Astro middleware — runs on every dynamic (prerender = false) request.
// Builds a server client from the request cookies and calls
// auth.getUser(). That single call is what refreshes/persists the
// auth-token cookies for the rest of the request, so subsequent
// createClient() calls on the same page see the user.
export const onRequest = defineMiddleware(async ({ cookies, locals }, next) => {
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
            try {
              if (typeof cookies?.getAll !== 'function') return [];
              return cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
            } catch {
              return [];
            }
          },
          setAll(cookiesToSet) {
            try {
              if (typeof cookies?.set !== 'function') return;
              for (const { name, value, options } of cookiesToSet) {
                cookies.set(name, value, options as any);
              }
            } catch {
              // Astro can throw if response headers have already been
              // sent (e.g. during a streamed response). Swallow — the
              // refreshed cookie just won't persist on this request.
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
    // Never crash the request from middleware. Log and continue —
    // pages will fall back to their own try/catch around getUser().
    console.error('[middleware] supabase init failed:', err);
  }

  return next();
});
