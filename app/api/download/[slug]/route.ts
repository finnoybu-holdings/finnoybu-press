import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DIGITAL_BUNDLE_PRODUCT_ID } from '@/lib/stripe'
import path from 'node:path'
import fs from 'node:fs'

export const dynamic = 'force-dynamic'

const FILE_TYPES: Record<string, { ext: string; contentType: string }> = {
  pdf: { ext: 'pdf', contentType: 'application/pdf' },
  epub: { ext: 'epub', contentType: 'application/epub+zip' },
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug
  const url = new URL(request.url)
  const format = url.searchParams.get('format') || 'pdf'

  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const fileType = FILE_TYPES[format]
  if (!fileType) {
    return NextResponse.json({ error: 'Invalid format (pdf or epub)' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('book_slug', slug)
    .eq('product_id', DIGITAL_BUNDLE_PRODUCT_ID)
    .limit(1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!purchases || purchases.length === 0) {
    return NextResponse.json({ error: 'Purchase required' }, { status: 403 })
  }

  // Files live at output/digital/<slug>/<slug>.{pdf,epub} (NOT in public/).
  const filename = `${slug}.${fileType.ext}`
  const filePath = path.join(process.cwd(), 'output', 'digital', slug, filename)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not yet available' }, { status: 404 })
  }

  const buffer = fs.readFileSync(filePath)
  return new Response(buffer, {
    headers: {
      'Content-Type': fileType.contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
