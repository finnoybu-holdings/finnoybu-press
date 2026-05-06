'use client'

import { useMemo } from 'react'
import zxcvbn from 'zxcvbn'
import styles from './PasswordStrength.module.css'

const LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'] as const

export function usePasswordStrength(password: string) {
  return useMemo(() => {
    if (!password) return null
    return zxcvbn(password)
  }, [password])
}

export default function PasswordStrength({ password }: { password: string }) {
  const result = usePasswordStrength(password)
  if (!result) return null
  const { score } = result

  return (
    <div className={styles.wrap}>
      <div className={styles.bars}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={styles.bar}
            data-active={i <= score}
            data-score={score}
          />
        ))}
      </div>
      <p className={styles.label} data-score={score}>
        {LABELS[score]}
        {result.feedback.warning && (
          <span className={styles.warning}> — {result.feedback.warning}</span>
        )}
      </p>
    </div>
  )
}
