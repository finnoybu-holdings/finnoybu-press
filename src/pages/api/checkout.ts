import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { createClient } from '../../lib/supabase/server';
import {
  stripe,
  DIGITAL_BUNDLE_PRICE_CENTS,
  DIGITAL_BUNDLE_CURRENCY,
  DIGITAL_BUNDLE_PRODUCT_ID,
} from '../../lib/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createClient(cookies);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Sign in to checkout' }, { status: 401 });
  }

  let payload: { slugs?: string[] };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const slugs = payload.slugs;
  if (!Array.isArray(slugs) || slugs.length === 0) {
    return Response.json({ error: 'Cart is empty' }, { status: 400 });
  }

  // Validate every slug against the books collection and assemble line items.
  const books = await getCollection('books');
  const bookMap = new Map(books.map((b) => [b.slug, b]));

  const lineItems: any[] = [];
  const validatedSlugs: string[] = [];

  for (const slug of slugs) {
    const book = bookMap.get(slug);
    if (!book) {
      return Response.json({ error: `Unknown book: ${slug}` }, { status: 400 });
    }
    validatedSlugs.push(slug);
    lineItems.push({
      price_data: {
        currency: DIGITAL_BUNDLE_CURRENCY,
        unit_amount: DIGITAL_BUNDLE_PRICE_CENTS,
        product_data: {
          name: `${book.data.title} — PDF & ePub`,
          metadata: { book_slug: slug },
        },
      },
      quantity: 1,
    });
  }

  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    metadata: {
      user_id: user.id,
      product_id: DIGITAL_BUNDLE_PRODUCT_ID,
      // Stripe metadata values must be strings; pack the slug list as JSON.
      book_slugs: JSON.stringify(validatedSlugs),
    },
    line_items: lineItems,
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
  });

  return Response.json({ url: session.url });
};
