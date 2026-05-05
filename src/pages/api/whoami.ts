import type { APIRoute } from 'astro';

export const prerender = false;

// Diagnostic: shows exactly what the server sees on a request.
// Returns the cookie names sent by the browser, plus what
// supabase.auth.getUser() resolves to. Open in a new tab to debug
// auth-cookie sync issues. All work is wrapped in try/catch so
// failures surface as JSON, not a 500.
export const GET: APIRoute = async ({ cookies }) => {
  const result: any = {
    cookieNames: [],
    supabaseCookies: [],
    serverSeesUser: false,
    user: null,
    userError: null as string | null,
    envHasSupabaseUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
    envHasAnonKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  };

  try {
    const allCookies = cookies.getAll().map((c) => ({
      name: c.name,
      valueLength: (c.value ?? '').length,
    }));
    result.cookieNames = allCookies.map((c) => c.name);
    result.supabaseCookies = allCookies.filter((c) => c.name.startsWith('sb-'));
  } catch (err: any) {
    result.userError = `cookie-read: ${err?.message ?? String(err)}`;
  }

  try {
    const { createClient } = await import('../../lib/supabase/server');
    const supabase = createClient(cookies);
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      result.userError = `getUser: ${error.message}`;
    } else if (data.user) {
      result.serverSeesUser = true;
      result.user = { id: data.user.id, email: data.user.email };
    }
  } catch (err: any) {
    result.userError = `getUser-throw: ${err?.message ?? String(err)}`;
  }

  return new Response(JSON.stringify(result, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
