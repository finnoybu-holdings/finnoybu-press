'use client'

import { createClient } from '@/lib/supabase/client'
import { clearCart } from '@/lib/cart'
import styles from './page.module.css'

export default function SignOutButton() {
  const handle = async () => {
    try {
      const supabase = createClient()
      if (supabase) await supabase.auth.signOut()
      try { clearCart() } catch {}
    } catch {}
    window.location.href = '/'
  }
  return (
    <button type="button" className={styles.linkBtn} onClick={handle}>
      Sign out
    </button>
  )
}
