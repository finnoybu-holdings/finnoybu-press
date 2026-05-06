import Link from 'next/link'
import type { Metadata } from 'next'
import styles from './not-found.module.css'

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'That page wandered off.',
}

export default function NotFound() {
  return (
    <article className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <span className="eyebrow">404</span>
        <h1>That page wandered off.</h1>
        <p className="lede">
          The link you followed has expired, moved, or was never quite right.
        </p>
        <ul className={styles.suggestions}>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/series">The Series</Link></li>
          <li><Link href="/collections/aegis-toolkits">AEGIS Toolkits</Link></li>
          <li><Link href="/about">About Finnoybu Press</Link></li>
        </ul>
      </div>
    </article>
  )
}
