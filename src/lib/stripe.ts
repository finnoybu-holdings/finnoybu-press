import Stripe from 'stripe';

export const stripe = new Stripe(
  import.meta.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  { apiVersion: '2026-03-25.dahlia' as any }
);

export const DIGITAL_BUNDLE_CURRENCY = 'usd';
export const DIGITAL_BUNDLE_PRODUCT_ID = 'pdf-epub';

// Price per book comes from the book's content-collection metadata
// (formats[type=pdf-epub].price, e.g. "$7.99"). Parse to cents at use site.
export function priceStringToCents(price: string): number {
  const cleaned = price.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  return Math.round(parseFloat(cleaned) * 100);
}
