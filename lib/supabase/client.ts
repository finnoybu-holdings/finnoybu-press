import { createBrowserClient } from '@supabase/ssr'

const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN

// Returns null when Supabase env vars aren't configured. That lets the
// dev server run (and the UI render) without a Supabase project — auth
// is just inert until env vars are present. Callers must guard for null
// before calling .auth.* methods.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null
  return createBrowserClient(
    url,
    key,
    cookieDomain ? { cookieOptions: { domain: cookieDomain } } : undefined
  )
}
