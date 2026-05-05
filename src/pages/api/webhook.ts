import type { APIRoute } from 'astro';
import { stripe, DIGITAL_BUNDLE_PRODUCT_ID } from '../../lib/stripe';
import { createServiceClient } from '../../lib/supabase/server';

export const prerender = false;

type Grant = { slug: string; kind: 'book' | 'toolkit' };

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session: any = event.data.object;
    const userId = session.metadata?.user_id;
    if (!userId) {
      return Response.json({ received: true });
    }

    // Parse the grants list (current format: every item the buyer should
    // receive, expanded from any bundles at checkout time). Fall back to
    // the legacy book_slugs list for any old sessions still in flight.
    let grants: Grant[] = [];
    try {
      const raw = session.metadata?.grants;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          grants = parsed.filter(
            (g: any) =>
              g && typeof g.slug === 'string' && (g.kind === 'book' || g.kind === 'toolkit')
          );
        }
      }
      if (grants.length === 0 && session.metadata?.book_slugs) {
        const legacySlugs = JSON.parse(session.metadata.book_slugs);
        if (Array.isArray(legacySlugs)) {
          grants = legacySlugs.map((slug: string) => ({ slug, kind: 'book' as const }));
        }
      }
    } catch {
      grants = [];
    }

    if (grants.length === 0) {
      return Response.json({ received: true });
    }

    const supabase = createServiceClient();
    const totalAmount = session.amount_total || 0;
    const perGrant = Math.round(totalAmount / grants.length);

    // Schema's `book_slug` column actually holds any item slug (book or
    // toolkit). `product_id` differentiates: 'pdf-epub' for books,
    // 'toolkit-pdf' for toolkits. Future schema rename → `item_slug`.
    const rows = grants.map((g) => ({
      user_id: userId,
      book_slug: g.slug,
      product_id: g.kind === 'toolkit' ? 'toolkit-pdf' : DIGITAL_BUNDLE_PRODUCT_ID,
      stripe_session_id: session.id,
      amount_cents: perGrant,
      currency: session.currency || 'usd',
    }));

    const { error } = await supabase
      .from('purchases')
      .upsert(rows, { onConflict: 'stripe_session_id,book_slug' });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return Response.json({ received: true });
};
