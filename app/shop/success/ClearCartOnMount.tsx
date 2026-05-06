'use client'

import { useEffect } from 'react'
import { clearCart } from '@/lib/cart'

// On the success page, clear localStorage cart so the user doesn't see
// stale items if they navigate back to /cart.
export default function ClearCartOnMount() {
  useEffect(() => {
    try { clearCart() } catch {}
  }, [])
  return null
}
