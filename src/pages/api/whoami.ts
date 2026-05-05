import type { APIRoute } from 'astro';
import { createClient } from '../../lib/supabase/server';

export const prerender = false;

// Diagnostic: shows exactly what the server sees on a request.
// Returns the cookie names sent by the browser, plus what
// supabase.auth.getUser() resolves to. Open in a new tab to debug
// auth-cookie sync issues.
export const GET: APIRoute = async ({ cookies }) => {
  const allCookies = cookies.getAll().map((c) => ({
    name: c.name,
    valueLength: c.value?.length ?? 0,
  }));

  const supabaseCookies = allCookies.filter((c) => c.name.startsWith('sb-'));

  let userResult: any = null;
  let userError: string | null = null;
  try {
    const supabase = createClient(cookies);
    const { data, error } = await supabase.auth.getUser();
    if (error) userError = error.message;
    else userResult = data.user
      ? { id: data.user.id, email: data.user.email }
      : null;
  } catch (err: any) {
    userError = err?.message ?? String(err);
  }

  return new Response(
    JSON.stringify(
      {
        cookieNames: allCookies.map((c) => c.name),
        supabaseCookies,
        serverSeesUser: !!userResult,
        user: userResult,
        userError,
      },
      null,
      2
    ),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
