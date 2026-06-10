import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { getDb, schema } from '~/db';
import { getEnv } from '~/lib/env';

export const prerender = false;

const FILE_TYPES: Record<string, { ext: string; contentType: string }> = {
  pdf: { ext: 'pdf', contentType: 'application/pdf' },
  epub: { ext: 'epub', contentType: 'application/epub+zip' },
  zip: { ext: 'zip', contentType: 'application/zip' },
};

// Auth-gated streaming download from the R2 bucket bound as `PDFS`.
//
// Files are uploaded by slug:
//   wrangler r2 object put finnoybu-press-pdfs/<slug>/<slug>.pdf  --file=output/digital/<slug>/<slug>.pdf
//   wrangler r2 object put finnoybu-press-pdfs/<slug>/<slug>.epub --file=output/digital/<slug>/<slug>.epub
//
// A user can fetch the file only if they own a purchase row for the slug
// (regardless of whether they bought it as a book or as part of a toolkit/
// bundle expansion — the webhook records one row per granted slug).
export const GET: APIRoute = async (ctx) => {
  const slug = ctx.params.slug;
  const format = ctx.url.searchParams.get('format') || 'pdf';

  if (!slug) return Response.json({ error: 'Missing slug' }, { status: 400 });

  const fileType = FILE_TYPES[format];
  if (!fileType) {
    return Response.json({ error: 'Invalid format (pdf, epub, or zip)' }, { status: 400 });
  }

  const user = ctx.locals.user;
  if (!user) {
    return Response.json({ error: 'Sign in required' }, { status: 401 });
  }

  const env = getEnv();
  if (!env.PDFS) {
    return Response.json({ error: 'R2 binding not configured' }, { status: 503 });
  }

  // Verify ownership.
  const db = getDb();
  const [owned] = await db
    .select({ id: schema.purchases.id })
    .from(schema.purchases)
    .where(
      and(
        eq(schema.purchases.userId, user.id),
        eq(schema.purchases.bookSlug, slug),
      ),
    )
    .limit(1);

  if (!owned) {
    return Response.json({ error: 'Purchase required' }, { status: 403 });
  }

  // Pull from R2. Object key is `<slug>/<slug>.<ext>`.
  const key = `${slug}/${slug}.${fileType.ext}`;
  const obj = await env.PDFS.get(key);
  if (!obj) {
    return Response.json({ error: 'File not yet available' }, { status: 404 });
  }

  return new Response(obj.body, {
    headers: {
      'Content-Type': fileType.contentType,
      'Content-Disposition': `attachment; filename="${slug}.${fileType.ext}"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
