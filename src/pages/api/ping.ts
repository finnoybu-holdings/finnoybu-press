import type { APIRoute } from 'astro';

export const prerender = false;

// Smoke test: hit /api/ping. If this 500s, the problem is in the
// request pipeline (middleware, adapter), not in our auth code.
export const GET: APIRoute = async () =>
  new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
    headers: { 'content-type': 'application/json' },
  });
