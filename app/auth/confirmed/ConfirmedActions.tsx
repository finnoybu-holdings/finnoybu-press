'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthModal } from '@/components/AuthModalContext'

export default function ConfirmedActions() {
  const { setOpen } = useAuthModal()

  // Sign the user out on arrival — Supabase implicitly creates a
  // session during email confirmation, but we want sign-in to be a
  // deliberate next action.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.signOut().catch(() => {})
  }, [])

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        Sign in
      </button>
    </div>
  )
}
