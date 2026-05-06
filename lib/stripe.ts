import Stripe from 'stripe'

// Server-side only. STRIPE_SECRET_KEY must never be exposed to the
// browser bundle — Next.js will refuse to inline non-NEXT_PUBLIC_ vars
// into client code, which is exactly what we want here.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-03-25.dahlia' as any,
})

export const DIGITAL_BUNDLE_CURRENCY = 'usd'
export const DIGITAL_BUNDLE_PRODUCT_ID = 'pdf-epub'

export function priceStringToCents(priceStr: string): number {
  const cleaned = (priceStr || '').replace(/[^0-9.]/g, '')
  return cleaned ? Math.round(parseFloat(cleaned) * 100) : 0
}
