'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCart, setCart, onCartChange, type CartItem, formatCents } from '@/lib/cart'
import { useAuthModal } from './AuthModalContext'
import styles from './CartView.module.css'

interface BookForClient {
  slug: string
  number: number
  title: string
  subtitle: string
  cover_thumb: string
  accent_color: string
  price_cents: number
}
interface ToolkitForClient {
  slug: string
  number: number
  tier: string
  title: string
  subtitle: string
  cover_thumb: string
  accent_color: string
  price_cents: number
}
interface BundleForClient {
  id: string
  label: string
  description: string
  discountPercent: number
  accent_color: string
  book_count: number
  toolkit_count: number
  included_book_slugs: string[]
  included_toolkit_slugs: string[]
  gross_cents: number
  net_cents: number
}

interface Props {
  signedIn: boolean
  books: BookForClient[]
  toolkits: ToolkitForClient[]
  bundles: BundleForClient[]
}

export default function CartView({ signedIn, books, toolkits, bundles }: Props) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setOpen: openAuthModal } = useAuthModal()

  useEffect(() => {
    const refresh = () => setItems(getCart())
    refresh()
    setHydrated(true)
    return onCartChange(refresh)
  }, [])

  const bookMap = new Map(books.map((b) => [b.slug, b]))
  const toolkitMap = new Map(toolkits.map((t) => [t.slug, t]))
  const bundleMap = new Map(bundles.map((b) => [b.id, b]))

  // Sort: bundles first (largest discount-percent first), then books by
  // catalog number, then toolkits by tier number.
  const sorted = [...items].sort((a, b) => {
    const orderKind = (it: CartItem) =>
      it.kind === 'bundle' ? 0 : it.kind === 'book' ? 1 : 2
    const ka = orderKind(a)
    const kb = orderKind(b)
    if (ka !== kb) return ka - kb
    if (a.kind === 'bundle' && b.kind === 'bundle') {
      return (
        (bundleMap.get(b.bundleId)?.discountPercent ?? 0) -
        (bundleMap.get(a.bundleId)?.discountPercent ?? 0)
      )
    }
    if (a.kind === 'book' && b.kind === 'book') {
      return (bookMap.get(a.slug)?.number ?? 999) - (bookMap.get(b.slug)?.number ?? 999)
    }
    if (a.kind === 'toolkit' && b.kind === 'toolkit') {
      return (toolkitMap.get(a.slug)?.number ?? 999) - (toolkitMap.get(b.slug)?.number ?? 999)
    }
    return 0
  })

  let totalCents = 0
  let visibleCount = 0
  for (const item of sorted) {
    if (item.kind === 'bundle') {
      const b = bundleMap.get(item.bundleId)
      if (b) { totalCents += b.net_cents; visibleCount++ }
    } else if (item.kind === 'book') {
      const b = bookMap.get(item.slug)
      if (b) { totalCents += b.price_cents; visibleCount++ }
    } else {
      const t = toolkitMap.get(item.slug)
      if (t) { totalCents += t.price_cents; visibleCount++ }
    }
  }

  const removeBook = (slug: string) =>
    setCart(getCart().filter((it) => !(it.kind === 'book' && it.slug === slug)))
  const removeToolkit = (slug: string) =>
    setCart(getCart().filter((it) => !(it.kind === 'toolkit' && it.slug === slug)))
  const removeBundle = (id: string) =>
    setCart(getCart().filter((it) => !(it.kind === 'bundle' && it.bundleId === id)))

  const checkout = async () => {
    setError(null)
    if (items.length === 0) return
    setCheckingOut(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Checkout failed.')
        setCheckingOut(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
      setCheckingOut(false)
    }
  }

  if (!hydrated) {
    return <article className={`${styles.page} container`} />
  }

  if (items.length === 0) {
    return (
      <article className={`${styles.page} container`}>
        <div className={styles.empty}>
          <h1>Your Finnoybu Press cart is empty.</h1>
          <p className={styles.emptyProse}>Browse the catalog to find your next book.</p>
          <Link href="/#collections" className={styles.primaryBtn}>Browse the catalog</Link>
        </div>
      </article>
    )
  }

  const itemsLabel = visibleCount === 1 ? '1 item' : `${visibleCount} items`

  return (
    <article className={`${styles.page} container`}>
      <div className={styles.grid}>
        <section className={styles.main}>
          <div className={styles.head}>
            <h1>Shopping Cart</h1>
            <span className={styles.priceColLabel}>Price</span>
          </div>
          <p className={styles.continueShopping}>
            <Link href="/#collections">← Continue shopping</Link>
          </p>

          <ul className={styles.list}>
            {sorted.map((item, idx) => {
              if (item.kind === 'bundle') {
                const b = bundleMap.get(item.bundleId)
                if (!b) return null
                const includedTitles = [
                  ...b.included_book_slugs.map((s) => bookMap.get(s)?.title).filter(Boolean) as string[],
                  ...b.included_toolkit_slugs
                    .map((s) => {
                      const t = toolkitMap.get(s)
                      return t ? `${t.title} — ${t.subtitle}` : null
                    })
                    .filter(Boolean) as string[],
                ]
                const includedShort =
                  b.book_count > 0 && b.toolkit_count > 0
                    ? `${b.book_count} books + ${b.toolkit_count} toolkits`
                    : b.book_count > 0
                      ? `${b.book_count} books`
                      : `${b.toolkit_count} toolkits`
                return (
                  <li
                    key={`b-${b.id}-${idx}`}
                    className={`${styles.item} ${styles.bundleItem}`}
                    style={{ ['--accent' as any]: b.accent_color }}
                  >
                    <div className={styles.bundleMark} aria-hidden="true">BUNDLE</div>
                    <div className={styles.meta}>
                      <h3 className={styles.title}>{b.label}</h3>
                      <p className={styles.availability}>In stock — instant download</p>
                      <p className={styles.format}>{includedShort} · PDF + ePub digital bundle</p>
                      <details className={styles.bundleIncluded}>
                        <summary>What&rsquo;s included</summary>
                        <ol>
                          {includedTitles.map((t, i) => <li key={i}>{t}</li>)}
                        </ol>
                      </details>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => removeBundle(b.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className={styles.priceBlock}>
                      <span className={styles.price}>{formatCents(b.net_cents)}</span>
                      <span className={styles.strike}>{formatCents(b.gross_cents)}</span>
                      <span className={styles.savings}>Save {b.discountPercent}%</span>
                    </div>
                  </li>
                )
              }
              if (item.kind === 'book') {
                const book = bookMap.get(item.slug)
                if (!book) return null
                return (
                  <li key={`bk-${book.slug}`} className={styles.item}>
                    <Link href={`/books/${book.slug}`} className={styles.cover} aria-label={book.title}>
                      <img src={book.cover_thumb} alt={`${book.title} cover`} loading="lazy" />
                    </Link>
                    <div className={styles.meta}>
                      <Link href={`/books/${book.slug}`} className={styles.title}>
                        {book.title}: {book.subtitle}
                      </Link>
                      <p className={styles.availability}>In stock — instant download</p>
                      <p className={styles.format}>PDF + ePub digital bundle</p>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => removeBook(book.slug)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className={styles.priceBlock}>
                      <span className={styles.price}>{formatCents(book.price_cents)}</span>
                    </div>
                  </li>
                )
              }
              const tk = toolkitMap.get(item.slug)
              if (!tk) return null
              return (
                <li key={`tk-${tk.slug}`} className={styles.item}>
                  <Link href={`/toolkits/${tk.slug}`} className={styles.cover} aria-label={tk.title}>
                    <img src={tk.cover_thumb} alt={`${tk.title} cover`} loading="lazy" />
                  </Link>
                  <div className={styles.meta}>
                    <Link href={`/toolkits/${tk.slug}`} className={styles.title}>
                      {tk.title} — {tk.subtitle}
                    </Link>
                    <p className={styles.availability}>In stock — instant download</p>
                    <p className={styles.format}>PDF digital toolkit</p>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => removeToolkit(tk.slug)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className={styles.priceBlock}>
                    <span className={styles.price}>{formatCents(tk.price_cents)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <aside className={styles.summary}>
          <p className={styles.summaryLine}>
            Subtotal ({itemsLabel})<br />
            <strong>{formatCents(totalCents)}</strong>
          </p>

          {signedIn ? (
            <button
              type="button"
              className={styles.checkoutBtn}
              onClick={checkout}
              disabled={checkingOut}
            >
              {checkingOut ? 'Redirecting…' : 'Proceed to checkout'}
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.checkoutBtn}
                onClick={() => openAuthModal(true)}
              >
                Sign in to checkout
              </button>
              <p className={styles.signinNote}>
                Sign in or create an account to complete your purchase.
              </p>
            </>
          )}

          {error && <p className={styles.checkoutError}>{error}</p>}

          <p className={`${styles.continueShopping} ${styles.continueAside}`}>
            <Link href="/#collections">← Continue shopping</Link>
          </p>
        </aside>
      </div>
    </article>
  )
}
