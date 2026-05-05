import type { APIRoute } from 'astro';
import { createClient } from '../../lib/supabase/server';

export const prerender = false;

// Auth callback: handles Supabase OAuth, magic-link, signup confirmation,
// and password-recovery returns. Mirrors the fiction-site /auth/callback
// flow: PKCE code exchange + token_hash OTP verification + recovery
// detection (a recovery session redirects to "/?recovery=true" so the
// recovery modal can prompt the user to set a new password).
export const GET: APIRoute = async ({ url, cookies, redirect, request }) => {
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = url.searchParams.get('next') || '/account';
  const origin = url.origin;

  const supabase = createClient(cookies, request);

  // Default destination for password-recovery flows when the caller
  // didn't set ?next=. Keeps recovery from landing on the regular
  // signed-in /account home.
  const recoveryNext = next === '/account' ? '/account/update-password' : next;

  // PKCE flow: signup confirmation, magic link, OAuth, recovery.
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('Auth callback (code) error:', error.message);
      return redirect(`${origin}/?auth_error=true`);
    }
    // Recovery sessions carry a recent recovery_sent_at timestamp on the
    // user. Honour the caller's ?next= when present (the SignInModal's
    // forgot-password flow sets it to /account/update-password); fall back
    // to /account/update-password otherwise.
    const recoverySentAt = data.user?.recovery_sent_at;
    if (recoverySentAt) {
      const elapsed = Date.now() - new Date(recoverySentAt).getTime();
      if (elapsed < 60 * 60 * 1000) {
        return redirect(`${origin}${recoveryNext}`);
      }
    }
    return redirect(`${origin}${next}`);
  }

  // Token-hash flow: password recovery, email change.
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    });
    if (error) {
      console.error('Auth callback (otp) error:', error.message);
      return redirect(`${origin}/?auth_error=true`);
    }
    if (type === 'recovery') {
      return redirect(`${origin}${recoveryNext}`);
    }
    return redirect(`${origin}${next}`);
  }

  // No auth params present — bounce to home with an error flag.
  return redirect(`${origin}/?auth_error=true`);
};
