'use client'

// Promotes a bundle (Collection or Series) with one-click add-to-cart.
// Receives pre-resolved totals + included slugs as props from a server
// component so we don't read content collection at the client.

import { useEffect, useState } from 'react'
import {
  addBundleToCart,
  removeBundleFromCart,
  isBundleInCart,
  onCartChange,
  formatCents,
} from '@/lib/cart'
import styles from './BundleCTA.module.css'

interface Props {
  bundleId: string
  label: string
  description: string
  accentColor: string
  discountPercent: number
  grossCents: number
  netCents: number
  includedBooks: string[]
  includedToolkits: string[]
}

export default function BundleCTA({
  bundleId,
  label,
  description,
  accentColor,
  discountPercent,
  grossCents,
  netCents,
  includedBooks,
  includedToolkits,
}: Props) {
  const [inCart, setInCart] = useState(false)

  useEffect(() => {
    const refresh = () => setInCart(isBundleInCart(bundleId))
    refresh()
    return onCartChange(refresh)
  }, [bundleId])

  const includedShort =
    includedBooks.length > 0 && includedToolkits.length > 0
      ? `${includedBooks.length} books + ${includedToolkits.length} toolkits`
      : includedBooks.length > 0
        ? `${includedBooks.length} books`
        : `${includedToolkits.length} toolkits`

  const handle = () => {
    if (isBundleInCart(bundleId)) {
      removeBundleFromCart(bundleId)
    } else {
      addBundleToCart(bundleId, includedBooks, includedToolkits)
    }
  }

  return (
    <aside className={styles.cta} style={{ ['--bundle-accent' as any]: accentColor }}>
      <div className={styles.info}>
        <p className={styles.eyebrow}>Bundle · Save {discountPercent}%</p>
        <h2>{label}</h2>
        <p className={styles.desc}>{description}</p>
        <p className={styles.meta}>{includedShort} · PDF + ePub digital editions</p>
      </div>
      <div className={styles.priceBlock}>
        <p className={styles.strike}>{formatCents(grossCents)}</p>
        <p className={styles.price}>{formatCents(netCents)}</p>
        <p className={styles.savings}>You save {formatCents(grossCents - netCents)}</p>
        <button
          type="button"
          className={`${styles.btn} ${inCart ? styles.inCart : ''}`}
          onClick={handle}
        >
          {inCart ? 'In cart — remove bundle' : 'Add bundle to cart'}
        </button>
      </div>
    </aside>
  )
}
