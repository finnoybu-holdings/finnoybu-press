import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/auth/signout — endpoint for any caller that prefers a
// server-side signout. The /account Sign out button uses
// supabase.auth.signOut() directly client-side and reloads, so this
// route is largely a fallback / parity with the old Astro version.
export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}
