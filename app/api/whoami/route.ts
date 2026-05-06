import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Diagnostic endpoint — useful for verifying the Supabase auth pipeline
// is wired correctly end to end. Open in a browser tab to see whether
// the server can read the session.
export async function GET(request: NextRequest) {
  const raw = request.headers.get('cookie') ?? ''
  const cookieNames = raw
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const eq = c.indexOf('=')
      return eq < 0 ? c : c.slice(0, eq)
    })
  const supabaseCookies = cookieNames.filter((n) => n.startsWith('sb-'))

  let serverSeesUser = false
  let userEmail: string | null = null
  let userError: string | null = null
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) userError = `getUser: ${error.message}`
    else if (data.user) {
      serverSeesUser = true
      userEmail = data.user.email ?? null
    }
  } catch (err: any) {
    userError = `getUser-throw: ${err?.message ?? String(err)}`
  }

  return NextResponse.json({
    ok: true,
    envHasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    envHasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    cookieNames,
    supabaseCookies,
    serverSeesUser,
    userEmail,
    userError,
  })
}
