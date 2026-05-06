'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CartIcon from './CartIcon'
import { useAuthModal } from './AuthModalContext'
import styles from './Nav.module.css'

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const { setOpen: openAuthModal } = useAuthModal()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setSignedIn(!!session?.user)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const closeMenu = () => setOpen(false)

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''} ${open ? styles.open : ''}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.wordmark} onClick={closeMenu}>Finnoybu Press</Link>

        <button
          className={styles.toggle}
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>

        <div className={styles.right}>
          <ul id="nav-links" className={styles.links}>
            <li><Link href="/#collections" onClick={closeMenu}>Collections</Link></li>
            <li><Link href="/series" onClick={closeMenu}>The Series</Link></li>
            <li><Link href="/about#author" onClick={closeMenu}>Author</Link></li>
            <li>
              {signedIn ? (
                <Link href="/account" onClick={closeMenu}>Account</Link>
              ) : (
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => { closeMenu(); openAuthModal(true) }}
                >
                  Sign in
                </button>
              )}
            </li>
          </ul>
          <CartIcon />
        </div>
      </div>
    </nav>
  )
}
