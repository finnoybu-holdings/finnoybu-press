'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCart, onCartChange } from '@/lib/cart'
import styles from './CartIcon.module.css'

export default function CartIcon() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => setCount(getCart().length)
    update()
    const off = onCartChange(update)
    return off
  }, [])

  return (
    <Link href="/cart" className={styles.icon} aria-label="Cart">
      <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
        <path
          d="M3 4h2l2.6 12.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={9} cy={20} r={1.4} fill="currentColor" />
        <circle cx={17} cy={20} r={1.4} fill="currentColor" />
      </svg>
      {count > 0 && <span className={styles.count}>{count}</span>}
    </Link>
  )
}
