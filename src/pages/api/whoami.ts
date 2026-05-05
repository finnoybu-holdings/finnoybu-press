import type { APIRoute } from 'astro';

export const prerender = false;

// Diagnostic — works off the raw Cookie header so it can't be broken
// by Astro's cookies-API quirks across versions/adapters.
export const GET: APIRoute = async ({ request, cookies }) => {
  const raw = request.headers.get('cookie') ?? '';
  const parsed = raw
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const eq = c.indexOf('=');
      return {
        name: eq < 0 ? c : c.slice(0, eq),
        valueLength: eq < 0 ? 0 : c.length - eq - 1,
      };
    });

  const supabaseCookies = parsed.filter((c) => c.name.startsWith('sb-'));

  let serverSeesUser = false;
  let userEmail: string | null = null;
  let userError: string | null = null;
  try {
    const { createClient } = await import('../../lib/supabase/server');
    const supabase = createClient(cookies, request);
    const { data, error } = await supabase.auth.getUser();
    if (error) userError = `getUser: ${error.message}`;
    else if (data.user) {
      serverSeesUser = true;
      userEmail = data.user.email ?? null;
    }
  } catch (err: any) {
    userError = `getUser-throw: ${err?.message ?? String(err)}`;
  }

  return new Response(
    JSON.stringify(
      {
        ok: true,
        envHasSupabaseUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
        envHasAnonKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
        rawCookieHeaderLength: raw.length,
        cookieNames: parsed.map((c) => c.name),
        supabaseCookies,
        serverSeesUser,
        userEmail,
        userError,
      },
      null,
      2
    ),
    { headers: { 'content-type': 'application/json' } }
  );
};
