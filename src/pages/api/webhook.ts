import type { APIRoute } from 'astro';
import { stripe, DIGITAL_BUNDLE_PRODUCT_ID } from '../../lib/stripe';
import { createServiceClient } from '../../lib/supabase/server';

export const prerender = false;

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
    const productId = session.metadata?.product_id || DIGITAL_BUNDLE_PRODUCT_ID;
    let slugs: string[] = [];
    try {
      slugs = JSON.parse(session.metadata?.book_slugs || '[]');
    } catch {
      slugs = [];
    }

    if (userId && slugs.length > 0) {
      const supabase = createServiceClient();
      const rows = slugs.map((slug) => ({
        user_id: userId,
        book_slug: slug,
        product_id: productId,
        stripe_session_id: session.id,
        amount_cents: Math.round((session.amount_total || 0) / slugs.length),
        currency: session.currency || 'usd',
      }));

      // Use upsert against the unique (stripe_session_id, book_slug) index so
      // webhook retries are idempotent.
      const { error } = await supabase
        .from('purchases')
        .upsert(rows, { onConflict: 'stripe_session_id,book_slug' });

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return Response.json({ received: true });
};
