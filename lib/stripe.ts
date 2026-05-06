import Stripe from 'stripe'

// Lazy Stripe client. Constructing eagerly at module load fails the
// build when STRIPE_SECRET_KEY isn't set in the build environment
// (the Stripe SDK throws "Neither apiKey nor config.authenticator
// provided" during page-data collection). Wrapping in a Proxy gives
// every consumer a real-looking client whose first method call is
// what triggers the actual SDK constructor at request time.
let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (_stripe) return _stripe
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-03-25.dahlia' as any,
  })
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop]
  },
})

export const DIGITAL_BUNDLE_CURRENCY = 'usd'
export const DIGITAL_BUNDLE_PRODUCT_ID = 'pdf-epub'

export function priceStringToCents(priceStr: string): number {
  const cleaned = (priceStr || '').replace(/[^0-9.]/g, '')
  return cleaned ? Math.round(parseFloat(cleaned) * 100) : 0
}
