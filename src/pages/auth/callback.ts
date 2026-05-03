import type { APIRoute } from 'astro';
import { createClient } from '../../lib/supabase/server';

export const prerender = false;

// OAuth + email-confirmation callback. Supabase redirects here after the
// provider round-trip with a `code` query param; we exchange it for a session.
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/account';

  if (code) {
    const supabase = createClient(cookies);
    await supabase.auth.exchangeCodeForSession(code);
  }

  return redirect(next);
};
