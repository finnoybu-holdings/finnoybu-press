import Stripe from 'stripe';

export const stripe = new Stripe(
  import.meta.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  { apiVersion: '2026-03-25.dahlia' as any }
);

// Single price across all books for the PDF+EPUB digital bundle.
// Override per-book later by switching to a lookup if needed.
export const DIGITAL_BUNDLE_PRICE_CENTS = 749;
export const DIGITAL_BUNDLE_CURRENCY = 'usd';
export const DIGITAL_BUNDLE_PRODUCT_ID = 'pdf-epub';
