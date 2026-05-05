import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase/server';
import { DIGITAL_BUNDLE_PRODUCT_ID } from '../../../lib/stripe';
import path from 'node:path';
import fs from 'node:fs';

export const prerender = false;

const FILE_TYPES: Record<string, { ext: string; contentType: string }> = {
  pdf: { ext: 'pdf', contentType: 'application/pdf' },
  epub: { ext: 'epub', contentType: 'application/epub+zip' },
};

export const GET: APIRoute = async ({ params, url, cookies, request }) => {
  const slug = params.slug;
  const format = url.searchParams.get('format') || 'pdf';

  if (!slug) {
    return Response.json({ error: 'Missing slug' }, { status: 400 });
  }

  const fileType = FILE_TYPES[format];
  if (!fileType) {
    return Response.json({ error: 'Invalid format (pdf or epub)' }, { status: 400 });
  }

  const supabase = createClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Sign in required' }, { status: 401 });
  }

  // Verify the user owns this book.
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('book_slug', slug)
    .eq('product_id', DIGITAL_BUNDLE_PRODUCT_ID)
    .limit(1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!purchases || purchases.length === 0) {
    return Response.json({ error: 'Purchase required' }, { status: 403 });
  }

  // Files live at output/digital/<slug>/<slug>.{pdf,epub}
  // (NOT in public/ — those would be world-readable without auth.)
  const filename = `${slug}.${fileType.ext}`;
  const filePath = path.join(process.cwd(), 'output', 'digital', slug, filename);

  if (!fs.existsSync(filePath)) {
    return Response.json({ error: 'File not yet available' }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);

  return new Response(buffer, {
    headers: {
      'Content-Type': fileType.contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
