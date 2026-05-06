'use client'

import { useAuthModal } from '@/components/AuthModalContext'
import styles from './page.module.css'

export default function LinkExpired() {
  const { setOpen } = useAuthModal()
  return (
    <>
      <p className={styles.eyebrow}>Link expired</p>
      <h1>This link has expired or is invalid.</h1>
      <p className={styles.lede}>
        Password-reset links expire after one hour. Request a new one from the sign-in page,
        or sign in directly if you remember your password.
      </p>
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        Sign in
      </button>
    </>
  )
}
