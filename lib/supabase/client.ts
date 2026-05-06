import { createBrowserClient } from '@supabase/ssr'

const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    cookieDomain ? { cookieOptions: { domain: cookieDomain } } : undefined
  )
}
