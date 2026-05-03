// Client-side cart, persisted in localStorage. The cart holds book slugs;
// titles, prices, and cover images are looked up from the books content
// collection at render time so they stay in sync if anything changes.

const STORAGE_KEY = 'fp-cart';

export interface CartItem {
  slug: string;       // matches a book in the content collection
  addedAt: number;    // timestamp; useful for "newest first" sorts
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((it) => it && typeof it.slug === 'string');
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  notifyChange();
}

export function addToCart(slug: string): boolean {
  const cart = getCart();
  if (cart.some((it) => it.slug === slug)) return false;
  cart.push({ slug, addedAt: Date.now() });
  setCart(cart);
  return true;
}

export function removeFromCart(slug: string): void {
  setCart(getCart().filter((it) => it.slug !== slug));
}

export function clearCart(): void {
  setCart([]);
}

export function isInCart(slug: string): boolean {
  return getCart().some((it) => it.slug === slug);
}

// Pub-sub for cart changes so the Nav badge can update without polling
const CHANGE_EVENT = 'fp-cart-change';

export function onCartChange(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const fn = () => handler();
  window.addEventListener(CHANGE_EVENT, fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener(CHANGE_EVENT, fn);
    window.removeEventListener('storage', fn);
  };
}

function notifyChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
