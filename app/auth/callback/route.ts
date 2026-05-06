import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/account'
  const origin = new URL(request.url).origin

  // Recovery flows default to the password-reset page when the caller
  // didn't pin a destination. Keeps the account home from showing up
  // mid-recovery.
  const recoveryNext = next === '/account' ? '/account/update-password' : next

  const hasAuth = code || token_hash
  const defaultRedirect = hasAuth ? `${origin}${next}` : `${origin}/?auth_error=true`
  const response = NextResponse.redirect(defaultRedirect)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(
              name,
              value,
              cookieDomain ? { ...options, domain: cookieDomain } : options
            )
          })
        },
      },
    }
  )

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Auth callback error:', error.message)
      response.headers.set('Location', `${origin}/?auth_error=true`)
      return response
    }
    // Recovery sessions are detected via recovery_sent_at on the user.
    // Send them to the password-update page.
    const recoverySentAt = data.user?.recovery_sent_at
    if (recoverySentAt) {
      const elapsed = Date.now() - new Date(recoverySentAt).getTime()
      if (elapsed < 60 * 60 * 1000) {
        response.headers.set('Location', `${origin}${recoveryNext}`)
      }
    }
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (error) {
      console.error('Auth callback OTP error:', error.message)
      response.headers.set('Location', `${origin}/?auth_error=true`)
      return response
    }
    if (type === 'recovery') {
      response.headers.set('Location', `${origin}${recoveryNext}`)
    }
  }

  return response
}
