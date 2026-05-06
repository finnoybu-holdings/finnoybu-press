import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAllBooks } from '@/lib/content'
import SignedOutCTA from './SignedOutCTA'
import SignOutButton from './SignOutButton'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Your Account',
  description: 'Your Finnoybu Press library and account.',
}

export const dynamic = 'force-dynamic'

interface PurchaseRow {
  book_slug: string
  created_at: string
}

export default async function AccountPage() {
  let user: { id: string; email?: string | null } | null = null
  let purchases: PurchaseRow[] = []
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      user = data.user

      if (user) {
        const { data: rows } = await supabase
          .from('purchases')
          .select('book_slug, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        purchases = (rows as PurchaseRow[]) || []
      }
    }
  } catch {
    user = null
    purchases = []
  }

  const allBooks = getAllBooks()
  const bookMap = new Map(allBooks.map((b) => [b.slug, b]))

  const ownedSlugs = Array.from(new Set(purchases.map((p) => p.book_slug)))
  const owned = ownedSlugs
    .map((slug) => {
      const book = bookMap.get(slug)
      if (!book) return null
      const earliest = purchases
        .filter((p) => p.book_slug === slug)
        .reduce((a, b) => (a.created_at < b.created_at ? a : b))
      return { book, purchased_at: earliest.created_at }
    })
    .filter(Boolean) as { book: NonNullable<ReturnType<typeof bookMap.get>>; purchased_at: string }[]

  return (
    <article className={styles.page}>
      <header className={`${styles.head} container`}>
        <h1>Your account</h1>
        {user && <p className={styles.subtitle}>Signed in as {user.email}</p>}
      </header>

      {!user ? (
        <section className={`container ${styles.signedOut}`}>
          <p>Sign in to access your library.</p>
          <SignedOutCTA />
        </section>
      ) : (
        <>
          <section className={`container ${styles.librarySection}`}>
            <div className={styles.sectionHead}>
              <span className="eyebrow">Your library</span>
              <h2>
                {owned.length === 0
                  ? 'No purchases yet.'
                  : `${owned.length} book${owned.length === 1 ? '' : 's'}.`}
              </h2>
            </div>

            {owned.length === 0 ? (
              <p className={styles.emptyNote}>
                When you purchase a book, it&rsquo;ll appear here with download links for the PDF and ePub.
              </p>
            ) : (
              <ul className={styles.libraryList}>
                {owned.map(({ book, purchased_at }) => (
                  <li key={book.slug} className={styles.libraryItem}>
                    <Link href={`/books/${book.slug}`} className={styles.libCover}>
                      <img
                        src={book.data.cover_thumb || book.data.cover_image}
                        alt={book.data.title}
                        loading="lazy"
                      />
                    </Link>
                    <div className={styles.libMeta}>
                      <h3>{book.data.title}</h3>
                      <p className={styles.libSubtitle}>{book.data.subtitle}</p>
                      <p className={styles.libPurchased}>
                        Purchased {new Date(purchased_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={styles.libActions}>
                      <a
                        href={`/api/download/${book.slug}?format=pdf`}
                        className={styles.dlBtn}
                        download
                      >
                        Download PDF
                      </a>
                      <a
                        href={`/api/download/${book.slug}?format=epub`}
                        className={styles.dlBtn}
                        download
                      >
                        Download ePub
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`container ${styles.actions}`}>
            <Link href="/account/update-password" className={styles.linkBtn}>
              Change password
            </Link>
            <SignOutButton />
          </section>
        </>
      )}
    </article>
  )
}
