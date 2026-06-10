import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getEnv } from '~/lib/env';
import {
  getStripe,
  priceStringToCents,
  DIGITAL_BUNDLE_CURRENCY,
  DIGITAL_BUNDLE_PRODUCT_ID,
} from '~/lib/stripe';
import { BUNDLES, bundleTotalCents } from '~/lib/bundles';

export const prerender = false;

type CartItemWire =
  | { kind: 'book'; slug: string }
  | { kind: 'toolkit'; slug: string }
  | { kind: 'bundle'; bundleId: string };

// Stripe metadata is keyed name → string and capped per-key (500-char value
// limit). We pack a flat list of every slug the buyer should be granted
// access to, so the webhook can record purchases without re-resolving bundle
// membership server-side. A Series purchase produces 24 grants (21 books + 3
// toolkits) from a single Stripe line item.

export const POST: APIRoute = async (ctx) => {
  const user = ctx.locals.user;
  if (!user) {
    return Response.json({ error: 'Sign in to checkout' }, { status: 401 });
  }

  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  let payload: { items?: CartItemWire[]; slugs?: string[] };
  try {
    payload = await ctx.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Accept legacy { slugs: [...] } as a list of book items.
  let items: CartItemWire[] = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0 && Array.isArray(payload.slugs)) {
    items = payload.slugs.map((slug) => ({ kind: 'book', slug }));
  }
  if (items.length === 0) {
    return Response.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const books = await getCollection('books');
  const toolkits = await getCollection('toolkits');
  const bookMap = new Map(books.map((b) => [b.id, b]));
  const toolkitMap = new Map(toolkits.map((t) => [t.id, t]));

  const bookCatalog = books.map((b) => {
    const fmt = b.data.formats.find((f) => f.type === DIGITAL_BUNDLE_PRODUCT_ID);
    return { slug: b.id, number: b.data.number, price_cents: priceStringToCents(fmt?.price ?? '') };
  });
  const toolkitCatalog = toolkits.map((t) => {
    const fmt = t.data.formats.find((f) => f.type === DIGITAL_BUNDLE_PRODUCT_ID);
    return { slug: t.id, number: t.data.number, price_cents: priceStringToCents(fmt?.price ?? '') };
  });

  type Grant = { slug: string; kind: 'book' | 'toolkit' };
  const lineItems: any[] = [];
  const grants: Grant[] = [];
  const grantedBookSlugs = new Set<string>();
  const grantedToolkitSlugs = new Set<string>();

  function addGrant(slug: string, kind: 'book' | 'toolkit') {
    const set = kind === 'book' ? grantedBookSlugs : grantedToolkitSlugs;
    if (set.has(slug)) return;
    set.add(slug);
    grants.push({ slug, kind });
  }

  for (const item of items) {
    if (item.kind === 'book') {
      const book = bookMap.get(item.slug);
      if (!book) return Response.json({ error: `Unknown book: ${item.slug}` }, { status: 400 });
      const fmt = book.data.formats.find((f) => f.type === DIGITAL_BUNDLE_PRODUCT_ID);
      if (!fmt) return Response.json({ error: `No PDF/EPUB bundle for: ${item.slug}` }, { status: 400 });
      const cents = priceStringToCents(fmt.price);
      if (!cents) return Response.json({ error: `Invalid price for: ${item.slug}` }, { status: 400 });
      lineItems.push({
        price_data: {
          currency: DIGITAL_BUNDLE_CURRENCY,
          unit_amount: cents,
          product_data: {
            name: `${book.data.title} — PDF & ePub`,
            metadata: { item_slug: item.slug, item_kind: 'book' },
          },
        },
        quantity: 1,
      });
      addGrant(item.slug, 'book');
    } else if (item.kind === 'toolkit') {
      const tk = toolkitMap.get(item.slug);
      if (!tk) return Response.json({ error: `Unknown toolkit: ${item.slug}` }, { status: 400 });
      const fmt = tk.data.formats.find((f) => f.type === DIGITAL_BUNDLE_PRODUCT_ID);
      if (!fmt) return Response.json({ error: `No PDF for toolkit: ${item.slug}` }, { status: 400 });
      const cents = priceStringToCents(fmt.price);
      if (!cents) return Response.json({ error: `Invalid price for toolkit: ${item.slug}` }, { status: 400 });
      lineItems.push({
        price_data: {
          currency: DIGITAL_BUNDLE_CURRENCY,
          unit_amount: cents,
          product_data: {
            name: `${tk.data.title} — ${tk.data.subtitle}`,
            metadata: { item_slug: item.slug, item_kind: 'toolkit' },
          },
        },
        quantity: 1,
      });
      addGrant(item.slug, 'toolkit');
    } else if (item.kind === 'bundle') {
      const bundle = BUNDLES.find((b) => b.id === item.bundleId);
      if (!bundle) return Response.json({ error: `Unknown bundle: ${item.bundleId}` }, { status: 400 });
      const totals = bundleTotalCents(bundle, bookCatalog, toolkitCatalog);
      if (!totals.net_cents) return Response.json({ error: `Bundle has no priced items: ${item.bundleId}` }, { status: 400 });
      lineItems.push({
        price_data: {
          currency: DIGITAL_BUNDLE_CURRENCY,
          unit_amount: totals.net_cents,
          product_data: {
            name: bundle.label,
            description: `${totals.included_book_slugs.length} books + ${totals.included_toolkit_slugs.length} toolkits, ${bundle.discountPercent}% off`,
            metadata: { bundle_id: bundle.id },
          },
        },
        quantity: 1,
      });
      for (const slug of totals.included_book_slugs) addGrant(slug, 'book');
      for (const slug of totals.included_toolkit_slugs) addGrant(slug, 'toolkit');
    } else {
      return Response.json({ error: 'Unknown cart item kind' }, { status: 400 });
    }
  }

  if (grants.length === 0) {
    return Response.json({ error: 'No items to grant' }, { status: 400 });
  }

  const origin = new URL(ctx.request.url).origin;
  const stripe = getStripe(env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    metadata: {
      user_id: user.id,
      // JSON-packed list of every slug to grant access to. Webhook reads
      // this and inserts one purchase row per grant.
      grants: JSON.stringify(grants),
    },
    line_items: lineItems,
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
  });

  return Response.json({ url: session.url });
};
