import Link from 'next/link'
import type { Metadata } from 'next'
import { stripe } from '@/lib/stripe'
import ClearCartOnMount from './ClearCartOnMount'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Purchase Confirmed',
  description: 'Thank you for your purchase.',
}

export const dynamic = 'force-dynamic'

export default async function SuccessPage(
  { searchParams }: { searchParams: { session_id?: string } }
) {
  const sessionId = searchParams.session_id
  let lineItemNames: string[] = []
  let totalDisplay = ''
  let valid = false

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items'],
      })
      if (session.payment_status === 'paid') {
        valid = true
        const items = (session as any).line_items?.data || []
        lineItemNames = items.map((it: any) => it.description)
        const total = (session.amount_total || 0) / 100
        totalDisplay = `$${total.toFixed(2)}`
      }
    } catch {
      valid = false
    }
  }

  return (
    <article className={`${styles.page} container`}>
      {sessionId && <ClearCartOnMount />}
      {valid ? (
        <>
          <header className={styles.head}>
            <span className={styles.eyebrow}>Purchase confirmed</span>
            <h1>Thank you.</h1>
            <p className={styles.subtitle}>
              Your downloads are ready in your account library.
            </p>
          </header>

          <section className={styles.summary}>
            <h2>What you bought</h2>
            <ul className={styles.items}>
              {lineItemNames.map((name, i) => <li key={i}>{name}</li>)}
            </ul>
            {totalDisplay && (
              <p className={styles.total}><strong>Total:</strong> {totalDisplay}</p>
            )}
          </section>

          <section className={styles.nextSteps}>
            <Link href="/account" className={styles.primaryBtn}>Go to your library</Link>
            <Link href="/#collections" className={styles.secondaryLink}>Continue browsing →</Link>
          </section>

          <p className={styles.receiptNote}>
            A receipt has been emailed to the address on your account.
          </p>
        </>
      ) : (
        <header className={styles.head}>
          <h1>Purchase status unclear.</h1>
          <p className={styles.subtitle}>
            We couldn&rsquo;t verify your checkout session. If you completed
            payment, your order should appear in <Link href="/account">your library</Link>{' '}
            within a few seconds. If something looks wrong, please contact{' '}
            <a href="mailto:press@finnoybu.org">press@finnoybu.org</a>.
          </p>
        </header>
      )}
    </article>
  )
}
