// Client-side cart, persisted in localStorage. Holds three kinds of items:
// books, toolkits, and bundles (multi-item discount packages). Lookups
// (titles, prices, covers) happen at render time against the catalog so
// metadata stays in sync across content updates.

const STORAGE_KEY = 'fp-cart'
const CHANGE_EVENT = 'fp-cart-change'

export type CartItem =
  | { kind: 'book'; slug: string; addedAt: number }
  | { kind: 'toolkit'; slug: string; addedAt: number }
  | { kind: 'bundle'; bundleId: string; addedAt: number }

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((it) => it && typeof it === 'object')
      .map((it: any): CartItem | null => {
        if (it.kind === 'bundle' && typeof it.bundleId === 'string') {
          return { kind: 'bundle', bundleId: it.bundleId, addedAt: it.addedAt || Date.now() }
        }
        if (it.kind === 'toolkit' && typeof it.slug === 'string') {
          return { kind: 'toolkit', slug: it.slug, addedAt: it.addedAt || Date.now() }
        }
        if (typeof it.slug === 'string') {
          return { kind: 'book', slug: it.slug, addedAt: it.addedAt || Date.now() }
        }
        return null
      })
      .filter((it): it is CartItem => it !== null)
  } catch {
    return []
  }
}

export function setCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  notifyChange()
}

function bookSlugsInCart(cart: CartItem[]): Set<string> {
  return new Set(cart.filter((it) => it.kind === 'book').map((it) => (it as any).slug))
}
function toolkitSlugsInCart(cart: CartItem[]): Set<string> {
  return new Set(cart.filter((it) => it.kind === 'toolkit').map((it) => (it as any).slug))
}
function bundleIdsInCart(cart: CartItem[]): Set<string> {
  return new Set(cart.filter((it) => it.kind === 'bundle').map((it) => (it as any).bundleId))
}

export function addToCart(slug: string, kind: 'book' | 'toolkit' = 'book'): boolean {
  const cart = getCart()
  const existing = kind === 'book' ? bookSlugsInCart(cart) : toolkitSlugsInCart(cart)
  if (existing.has(slug)) return false
  cart.push({ kind, slug, addedAt: Date.now() } as CartItem)
  setCart(cart)
  return true
}

export function removeFromCart(slug: string, kind: 'book' | 'toolkit' = 'book'): void {
  setCart(getCart().filter((it) => !(it.kind === kind && (it as any).slug === slug)))
}

export function addBundleToCart(
  bundleId: string,
  includedBookSlugs: string[],
  includedToolkitSlugs: string[]
): boolean {
  const cart = getCart()
  if (bundleIdsInCart(cart).has(bundleId)) return false
  const bookSet = new Set(includedBookSlugs)
  const toolkitSet = new Set(includedToolkitSlugs)
  const remaining = cart.filter((it) => {
    if (it.kind === 'book' && bookSet.has((it as any).slug)) return false
    if (it.kind === 'toolkit' && toolkitSet.has((it as any).slug)) return false
    return true
  })
  remaining.push({ kind: 'bundle', bundleId, addedAt: Date.now() })
  setCart(remaining)
  return true
}

export function removeBundleFromCart(bundleId: string): void {
  setCart(getCart().filter((it) => !(it.kind === 'bundle' && (it as any).bundleId === bundleId)))
}

export function clearCart(): void {
  setCart([])
}

export function isInCart(slug: string, kind: 'book' | 'toolkit' = 'book'): boolean {
  return getCart().some((it) => it.kind === kind && (it as any).slug === slug)
}

export function isBundleInCart(bundleId: string): boolean {
  return bundleIdsInCart(getCart()).has(bundleId)
}

export function onCartChange(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const fn = () => handler()
  window.addEventListener(CHANGE_EVENT, fn)
  window.addEventListener('storage', fn)
  return () => {
    window.removeEventListener(CHANGE_EVENT, fn)
    window.removeEventListener('storage', fn)
  }
}

function notifyChange(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

// Helper used everywhere prices are formatted — keeps display consistent.
export function priceStringToCents(priceStr: string): number {
  const cleaned = (priceStr || '').replace(/[^0-9.]/g, '')
  return cleaned ? Math.round(parseFloat(cleaned) * 100) : 0
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
