'use client'

import { useEffect, useState } from 'react'
import { addToCart, removeFromCart, isInCart, onCartChange } from '@/lib/cart'
import styles from '@/app/books/[slug]/page.module.css'

interface Props {
  slug: string
  label: string
  price: string
  kind?: 'book' | 'toolkit'
}

export default function BookFormatButton({ slug, label, price, kind = 'book' }: Props) {
  const [inCart, setInCart] = useState(false)

  useEffect(() => {
    const refresh = () => setInCart(isInCart(slug, kind))
    refresh()
    return onCartChange(refresh)
  }, [slug, kind])

  const toggle = () => {
    if (isInCart(slug, kind)) removeFromCart(slug, kind)
    else addToCart(slug, kind)
  }

  return (
    <button
      type="button"
      className={`${styles.format} ${styles.formatCart} ${inCart ? styles.inCart : ''}`}
      data-type="pdf-epub"
      onClick={toggle}
    >
      <span className={styles.formatType}>{inCart ? 'In cart' : label}</span>
      <span className={styles.formatPrice}>{inCart ? 'Remove' : price}</span>
    </button>
  )
}
