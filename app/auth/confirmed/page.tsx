import type { Metadata } from 'next'
import ConfirmedActions from './ConfirmedActions'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Email confirmed',
  description: 'Your Finnoybu Press account email is confirmed.',
}

// Server page renders the chrome; client child clears any stale session
// on arrival (Supabase signs the user in implicitly during email
// confirmation, but we want them to authenticate explicitly afterward).
export default function ConfirmedPage() {
  return (
    <article className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <span className="eyebrow">Account</span>
        <h1>Email confirmed.</h1>
        <p className="lede">
          Your account is ready. Sign in to access your library.
        </p>
        <ConfirmedActions />
      </div>
    </article>
  )
}
