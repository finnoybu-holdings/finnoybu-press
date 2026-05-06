import { NextResponse, type NextRequest } from 'next/server'
import { stripe, DIGITAL_BUNDLE_PRODUCT_ID } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Grant = { slug: string; kind: 'book' | 'toolkit' }

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const body = await request.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session: any = event.data.object
    const userId = session.metadata?.user_id
    if (!userId) return NextResponse.json({ received: true })

    let grants: Grant[] = []
    try {
      const raw = session.metadata?.grants
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          grants = parsed.filter(
            (g: any) =>
              g && typeof g.slug === 'string' && (g.kind === 'book' || g.kind === 'toolkit')
          )
        }
      }
      // Fallback: older sessions used book_slugs only.
      if (grants.length === 0 && session.metadata?.book_slugs) {
        const legacy = JSON.parse(session.metadata.book_slugs)
        if (Array.isArray(legacy)) {
          grants = legacy.map((slug: string) => ({ slug, kind: 'book' as const }))
        }
      }
    } catch {
      grants = []
    }

    if (grants.length === 0) return NextResponse.json({ received: true })

    const supabase = createServiceClient()
    const totalAmount = session.amount_total || 0
    const perGrant = Math.round(totalAmount / grants.length)

    const rows = grants.map((g) => ({
      user_id: userId,
      book_slug: g.slug,
      product_id: g.kind === 'toolkit' ? 'toolkit-pdf' : DIGITAL_BUNDLE_PRODUCT_ID,
      stripe_session_id: session.id,
      amount_cents: perGrant,
      currency: session.currency || 'usd',
    }))

    const { error } = await supabase
      .from('purchases')
      .upsert(rows, { onConflict: 'stripe_session_id,book_slug' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
