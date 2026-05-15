import type { APIRoute } from 'astro';
import { getDb, schema } from '~/db';
import { getEnv } from '~/lib/env';
import { getStripe, DIGITAL_BUNDLE_PRODUCT_ID } from '~/lib/stripe';

export const prerender = false;

type Grant = { slug: string; kind: 'book' | 'toolkit' };

// Stripe webhook handler. Inserts purchase rows when checkout completes.
// `constructEventAsync` (not constructEvent) is required on the Workers
// runtime because signature verification uses Web Crypto, not Node crypto.
export const POST: APIRoute = async (ctx) => {
  const env = getEnv(ctx);
  const sig = ctx.request.headers.get('stripe-signature');

  if (!sig || !env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Webhook not configured' }, { status: 400 });
  }

  const body = await ctx.request.text();
  const stripe = getStripe(env.STRIPE_SECRET_KEY);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err: any) {
    return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return Response.json({ received: true });
  }

  const session: any = event.data.object;
  const userId = session.metadata?.user_id;
  if (!userId) return Response.json({ received: true });

  let grants: Grant[] = [];
  try {
    const raw = session.metadata?.grants;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        grants = parsed.filter(
          (g: any) =>
            g && typeof g.slug === 'string' && (g.kind === 'book' || g.kind === 'toolkit'),
        );
      }
    }
    // Legacy fallback: older sessions used a flat book_slugs array.
    if (grants.length === 0 && session.metadata?.book_slugs) {
      const legacy = JSON.parse(session.metadata.book_slugs);
      if (Array.isArray(legacy)) {
        grants = legacy.map((slug: string) => ({ slug, kind: 'book' as const }));
      }
    }
  } catch {
    grants = [];
  }

  if (grants.length === 0) return Response.json({ received: true });

  const db = getDb(ctx);
  const totalAmount = session.amount_total || 0;
  const perGrant = Math.round(totalAmount / grants.length);

  // `book_slug` historically holds any item slug; `product_id` differentiates.
  // ON CONFLICT (stripe_session_id, book_slug) DO NOTHING gives webhook
  // idempotency: replays of the same event don't double-grant.
  const rows = grants.map((g) => ({
    userId,
    bookSlug: g.slug,
    productId: g.kind === 'toolkit' ? 'toolkit-pdf' : DIGITAL_BUNDLE_PRODUCT_ID,
    stripeSessionId: session.id,
    amountCents: perGrant,
    currency: session.currency || 'usd',
  }));

  try {
    await db
      .insert(schema.purchases)
      .values(rows)
      .onConflictDoNothing({
        target: [schema.purchases.stripeSessionId, schema.purchases.bookSlug],
      });
  } catch (err: any) {
    console.error('[webhook] insert failed', err);
    return Response.json({ error: err?.message ?? 'DB insert failed' }, { status: 500 });
  }

  return Response.json({ received: true });
};
