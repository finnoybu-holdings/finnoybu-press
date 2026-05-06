import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(
                name,
                value,
                cookieDomain ? { ...options, domain: cookieDomain } : options
              )
            )
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  )
}

// Service-role client — server-side only. Bypasses RLS.
// Used by the Stripe webhook to insert purchase rows.
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SECRET_KEY || '',
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  )
}
