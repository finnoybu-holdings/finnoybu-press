import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Run on every request EXCEPT static asset paths and common
    // build artifacts. Same shape as fiction's matcher, minus the
    // fiction-only API routes.
    '/((?!_next/static|_next/image|favicon.ico|images/|robots.txt|sitemap.xml).*)',
  ],
}
