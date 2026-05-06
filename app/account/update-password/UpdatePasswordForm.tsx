'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PasswordStrength, { usePasswordStrength } from '@/components/PasswordStrength'
import { useAuthModal } from '@/components/AuthModalContext'
import styles from './page.module.css'

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const strength = usePasswordStrength(password)
  const { setOpen: openAuthModal } = useAuthModal()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!strength || strength.score < 3) {
      setError('Please choose a stronger password.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      if (!supabase) { setError('Auth is not configured.'); setLoading(false); return }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      // Sign out so the user must re-authenticate with the new password.
      await supabase.auth.signOut()
      setDone(true)
      setLoading(false)
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Try again.')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <>
        <p className={styles.eyebrow}>Account</p>
        <h2>Password updated.</h2>
        <p className={styles.lede}>
          Your password has been changed. Please sign in with your new password.
        </p>
        <button type="button" className="btn" onClick={() => openAuthModal(true)}>
          Sign in
        </button>
      </>
    )
  }

  return (
    <>
      <p className={styles.eyebrow}>Account</p>
      <h1>Set a new password.</h1>

      <form onSubmit={onSubmit} className={styles.form} noValidate>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>New password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            required
            autoFocus
          />
        </label>

        <PasswordStrength password={password} />

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Confirm password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            minLength={8}
            required
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </>
  )
}
