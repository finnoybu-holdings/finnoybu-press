import type { APIRoute } from 'astro';

export const prerender = false;

// Diagnostic — kept deliberately minimal. If this 500s, the problem is
// in the request pipeline (middleware, adapter), not the auth code.
export const GET: APIRoute = async ({ cookies }) => {
  let cookieNames: string[] = [];
  let supabaseCookies: { name: string; valueLength: number }[] = [];
  let serverSeesUser = false;
  let userEmail: string | null = null;
  let userError: string | null = null;

  try {
    const all = cookies.getAll();
    cookieNames = all.map((c) => c.name);
    supabaseCookies = all
      .filter((c) => c.name.startsWith('sb-'))
      .map((c) => ({ name: c.name, valueLength: (c.value ?? '').length }));
  } catch (err: any) {
    userError = `cookies: ${err?.message ?? String(err)}`;
  }

  try {
    const mod = await import('../../lib/supabase/server');
    const supabase = mod.createClient(cookies);
    const { data, error } = await supabase.auth.getUser();
    if (error) userError = `getUser err: ${error.message}`;
    else if (data.user) {
      serverSeesUser = true;
      userEmail = data.user.email ?? null;
    }
  } catch (err: any) {
    userError = `getUser throw: ${err?.message ?? String(err)}`;
  }

  return new Response(
    JSON.stringify(
      {
        ok: true,
        envHasSupabaseUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
        envHasAnonKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
        cookieNames,
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
