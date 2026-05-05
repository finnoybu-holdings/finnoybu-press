import { defineMiddleware } from 'astro:middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const COOKIE_DOMAIN =
  import.meta.env.PUBLIC_AUTH_COOKIE_DOMAIN ||
  import.meta.env.AUTH_COOKIE_DOMAIN ||
  undefined;

// Astro middleware — runs on every dynamic (prerender = false) request.
// Mirrors the @supabase/ssr Astro recipe: build a server client from the
// request cookies and call auth.getUser(). That single call is what
// refreshes/persists the auth-token cookies for the rest of the request,
// so subsequent createClient() calls on the same page see the user.
//
// Without this, a freshly-set browser cookie sometimes won't be picked
// up by the server's createClient until the next request, because the
// server only reads cookies once per createClient() call and never
// refreshes them.
export const onRequest = defineMiddleware(async ({ cookies, locals, request }, next) => {
  if (!import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
    return next();
  }

  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          if (typeof cookies?.getAll !== 'function') return [];
          return cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet) {
          if (typeof cookies?.set !== 'function') return;
          for (const { name, value, options } of cookiesToSet) {
            const opts: CookieOptions & { domain?: string } = { ...options };
            if (COOKIE_DOMAIN) opts.domain = COOKIE_DOMAIN;
            cookies.set(name, value, opts as any);
          }
        },
      },
    }
  );

  // Calling getUser() here is what triggers the cookie refresh. Result
  // stashed on locals so pages can read it without a second round-trip.
  try {
    const { data } = await supabase.auth.getUser();
    (locals as any).user = data.user ?? null;
  } catch {
    (locals as any).user = null;
  }

  return next();
});
