'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './CookieBanner.module.css'

const STORAGE_KEY = 'finnoybu-press-cookies-accepted'
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000 // 24h — re-prompt to keep consent fresh

export default function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY)
      if (!accepted || Date.now() - Number(accepted) >= REFRESH_AFTER_MS) {
        setShow(true)
      }
    } catch {
      // localStorage may be unavailable (incognito, blocked) — show the
      // banner anyway; acceptance just won't persist.
      setShow(true)
    }
  }, [])

  if (!show) return null

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
    setShow(false)
  }

  return (
    <aside className={styles.banner}>
      <div className={styles.inner}>
        <p className={styles.msg}>
          This site uses cookies and local storage for authentication, cart
          persistence, and analytics.{' '}
          <Link href="/legal#cookie-policy" className={styles.learnMore}>Learn more</Link>
        </p>
        <button type="button" className={styles.accept} onClick={accept}>Got it</button>
      </div>
    </aside>
  )
}
