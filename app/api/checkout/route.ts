import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  stripe,
  priceStringToCents,
  DIGITAL_BUNDLE_CURRENCY,
  DIGITAL_BUNDLE_PRODUCT_ID,
} from '@/lib/stripe'
import { BUNDLES, bundleTotalCents } from '@/lib/bundles'
import { getAllBooks, getAllToolkits } from '@/lib/content'

export const dynamic = 'force-dynamic'

type CartItemWire =
  | { kind: 'book'; slug: string }
  | { kind: 'toolkit'; slug: string }
  | { kind: 'bundle'; bundleId: string }

// Stripe metadata is keyed name → string and capped per-key. Each session-level
// metadata key has a 500-char value limit. We pack a flat list of every slug
// the buyer should be granted access to (per kind) so the webhook can record
// purchases without re-resolving bundle membership server-side.
//
// `grants` is a JSON array of { slug, kind } so a Series purchase produces
// 24 grants (21 books + 3 toolkits) from a single Stripe line item.
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to checkout' }, { status: 401 })

  let payload: { items?: CartItemWire[]; slugs?: string[] }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let items: CartItemWire[] = Array.isArray(payload.items) ? payload.items : []
  if (items.length === 0 && Array.isArray(payload.slugs)) {
    items = payload.slugs.map((slug) => ({ kind: 'book', slug }))
  }
  if (items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const books = getAllBooks()
  const toolkits = getAllToolkits()
  const bookMap = new Map(books.map((b) => [b.slug, b]))
  const toolkitMap = new Map(toolkits.map((t) => [t.slug, t]))

  const bookCatalog = books.map((b) => {
    const fmt = b.data.formats.find((f) => f.type === DIGITAL_BUNDLE_PRODUCT_ID)
    return { slug: b.slug, number: b.data.number, price_cents: priceStringToCents(fmt?.price ?? '') }
  })
  const toolkitCatalog = toolkits.map((t) => {
    const fmt = t.data.formats.find((f) => f.type === DIGITAL_BUNDLE_PRODUCT_ID)
    return { slug: t.slug, number: t.data.number, price_cents: priceStringToCents(fmt?.price ?? '') }
  })

  type Grant = { slug: string; kind: 'book' | 'toolkit' }
  const lineItems: any[] = []
  const grants: Grant[] = []
  const grantedBookSlugs = new Set<string>()
  const grantedToolkitSlugs = new Set<string>()

  function addGrant(slug: string, kind: 'book' | 'toolkit') {
    const set = kind === 'book' ? grantedBookSlugs : grantedToolkitSlugs
    if (set.has(slug)) return
    set.add(slug)
    grants.push({ slug, kind })
  }

  for (const item of items) {
    if (item.kind === 'book') {
      const book = bookMap.get(item.slug)
      if (!book) return NextResponse.json({ error: `Unknown book: ${item.slug}` }, { status: 400 })
      const fmt = book.data.formats.find((f) => f.type === DIGITAL_BUNDLE_PRODUCT_ID)
      if (!fmt) return NextResponse.json({ error: `No PDF/EPUB bundle for: ${item.slug}` }, { status: 400 })
      const cents = priceStringToCents(fmt.price)
      if (!cents) return NextResponse.json({ error: `Invalid price for: ${item.slug}` }, { status: 400 })
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
      })
      addGrant(item.slug, 'book')
    } else if (item.kind === 'toolkit') {
      const tk = toolkitMap.get(item.slug)
      if (!tk) return NextResponse.json({ error: `Unknown toolkit: ${item.slug}` }, { status: 400 })
      const fmt = tk.data.formats.find((f) => f.type === DIGITAL_BUNDLE_PRODUCT_ID)
      if (!fmt) return NextResponse.json({ error: `No PDF for toolkit: ${item.slug}` }, { status: 400 })
      const cents = priceStringToCents(fmt.price)
      if (!cents) return NextResponse.json({ error: `Invalid price for toolkit: ${item.slug}` }, { status: 400 })
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
      })
      addGrant(item.slug, 'toolkit')
    } else if (item.kind === 'bundle') {
      const bundle = BUNDLES.find((b) => b.id === item.bundleId)
      if (!bundle) return NextResponse.json({ error: `Unknown bundle: ${item.bundleId}` }, { status: 400 })
      const totals = bundleTotalCents(bundle, bookCatalog, toolkitCatalog)
      if (!totals.net_cents) return NextResponse.json({ error: `Bundle has no priced items: ${item.bundleId}` }, { status: 400 })
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
      })
      for (const slug of totals.included_book_slugs) addGrant(slug, 'book')
      for (const slug of totals.included_toolkit_slugs) addGrant(slug, 'toolkit')
    } else {
      return NextResponse.json({ error: 'Unknown cart item kind' }, { status: 400 })
    }
  }

  if (grants.length === 0) {
    return NextResponse.json({ error: 'No items to grant' }, { status: 400 })
  }

  const origin = new URL(request.url).origin

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    metadata: {
      user_id: user.id,
      grants: JSON.stringify(grants),
    },
    line_items: lineItems,
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
  })

  return NextResponse.json({ url: session.url })
}
