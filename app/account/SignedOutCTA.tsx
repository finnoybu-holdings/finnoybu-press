'use client'

import { useAuthModal } from '@/components/AuthModalContext'
import styles from './page.module.css'

export default function SignedOutCTA() {
  const { setOpen } = useAuthModal()
  return (
    <button type="button" className={styles.primaryBtn} onClick={() => setOpen(true)}>
      Sign in
    </button>
  )
}
