import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import UpdatePasswordForm from './UpdatePasswordForm'
import LinkExpired from './LinkExpired'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Set a new password',
  description: 'Choose a new password for your Finnoybu Press account.',
}

export const dynamic = 'force-dynamic'

export default async function UpdatePasswordPage() {
  let signedIn = false
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      signedIn = !!data.user
    }
  } catch { signedIn = false }

  return (
    <article className={styles.page}>
      <div className={`container ${styles.narrow}`}>
        {signedIn ? <UpdatePasswordForm /> : <LinkExpired />}
      </div>
    </article>
  )
}
