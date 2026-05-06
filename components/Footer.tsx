import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.about}>
            <span className={styles.wordmark}>Finnoybu Press</span>
            <p>
              Practical books and governance tools for the people actually using AI at work.
              An imprint of Finnoybu Holdings LLC.
            </p>
          </div>
          <div className={styles.cols}>
            <div>
              <h5>Catalog</h5>
              <ul>
                <li><Link href="/series">All books</Link></li>
                <li><Link href="/#collections">Collections</Link></li>
                <li><Link href="/collections/aegis-toolkits">AEGIS Toolkits</Link></li>
              </ul>
            </div>
            <div>
              <h5>About</h5>
              <ul>
                <li><Link href="/about#author">The author</Link></li>
                <li><Link href="/about#series-thesis">The series</Link></li>
                <li><Link href="/about#contact">Contact</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© {year} Finnoybu Press. All rights reserved.</span>
          <span>press.finnoybu.org</span>
        </div>
      </div>
    </footer>
  )
}
