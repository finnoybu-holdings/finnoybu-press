import Stripe from 'stripe';

// Stripe SDK on the Workers runtime: use the fetch-based HTTP client (the
// default uses Node's https which isn't available). Construct lazily per
// request so the secret key can come from the Cloudflare binding env rather
// than build-time import.meta.env.
export function getStripe(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia' as any,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export const DIGITAL_BUNDLE_CURRENCY = 'usd';
export const DIGITAL_BUNDLE_PRODUCT_ID = 'pdf-epub';

// Price per book comes from the book's content-collection metadata
// (formats[type=pdf-epub].price, e.g. "$7.99"). Parse to cents at use site.
export function priceStringToCents(price: string): number {
  const cleaned = price.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  return Math.round(parseFloat(cleaned) * 100);
}
