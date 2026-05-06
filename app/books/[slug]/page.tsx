import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import HeroCover from '@/components/HeroCover'
import BookFormatButton from '@/components/BookFormatButton'
import MobileBuyBar from '@/components/MobileBuyBar'
import { getAllBooks, getBook } from '@/lib/content'
import styles from './page.module.css'

const COLLECTION_LABELS: Record<string, { label: string; href: string }> = {
  'product-deep-dives': { label: 'Product Deep Dives', href: '/collections/product-deep-dives' },
  'product-guides': { label: 'Product Guides', href: '/collections/product-guides' },
  'cross-platform-skills': { label: 'Cross-Platform Skills', href: '/collections/cross-platform-skills' },
  'aegis-toolkits': { label: 'AEGIS Toolkits', href: '/collections/aegis-toolkits' },
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://press.finnoybu.org'

export function generateStaticParams() {
  return getAllBooks().map((b) => ({ slug: b.slug }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const book = getBook(params.slug)
  if (!book) return {}
  return {
    title: `${book.data.title}: ${book.data.subtitle}`,
    description: book.data.description,
    openGraph: {
      type: 'book',
      title: `${book.data.title}: ${book.data.subtitle}`,
      description: book.data.description,
      images: [book.data.cover_image.replace('/images/', '/images/og/')],
    },
  }
}

export default async function BookPage({ params }: { params: { slug: string } }) {
  const book = getBook(params.slug)
  if (!book) notFound()

  const collectionInfo = COLLECTION_LABELS[book.data.collection]
  const allBooks = getAllBooks()

  // Related books rules:
  //   Deep Dives (1-10): show flagships (1,3,5,7,9). If current is one of
  //     those, swap for current+1 (its companion).
  //   Other collections: show all the others in the same collection.
  let related: typeof allBooks
  if (book.data.collection === 'product-deep-dives') {
    const flagships = [1, 3, 5, 7, 9]
    const targetNums = flagships.map((n) => (n === book.data.number ? n + 1 : n))
    related = allBooks.filter((b) => targetNums.includes(b.data.number))
  } else {
    related = allBooks.filter(
      (b) => b.data.collection === book.data.collection && b.slug !== book.slug
    )
  }

  // schema.org Book metadata
  const bookSchema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: `${book.data.title}: ${book.data.subtitle}`,
    bookFormat: 'https://schema.org/EBook',
    author: { '@type': 'Person', name: book.data.author },
    publisher: { '@type': 'Organization', name: book.data.publisher },
    inLanguage: 'en-US',
    description: book.data.description,
    image: new URL(book.data.cover_image, SITE).toString(),
    numberOfPages: book.data.page_estimate ?? undefined,
    url: `${SITE}/books/${book.slug}`,
    ...(book.data.formats.filter((f) => f.url).length > 0 && {
      offers: book.data.formats
        .filter((f) => f.url)
        .map((f) => ({
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: f.price.replace(/[^0-9.]/g, ''),
          url: f.url,
          availability: 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
        })),
    }),
  }

  const bodyHtml = book.body && book.body.trim().length > 0 ? marked.parse(book.body) : ''

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }}
      />
      <article
        className={styles.page}
        style={{ ['--accent-color' as any]: book.data.accent_color }}
      >
        <header className={`${styles.bookHero} container`}>
          <div className={styles.heroMeta}>
            <Link href={collectionInfo.href} className={styles.breadcrumb}>← {collectionInfo.label}</Link>
            <span className={`eyebrow ${styles.eyebrowAccent}`}>{book.data.series_position}</span>
          </div>

          <div className={styles.bookHeroGrid}>
            <HeroCover
              className={styles.coverStage}
              src={book.data.cover_image}
              alt={`${book.data.title}: ${book.data.subtitle}`}
            />

            <div className={styles.heroText}>
              <h1>{book.data.title}</h1>
              <p className={styles.subtitle}>{book.data.subtitle}</p>

              <div className={styles.byline}>
                <span>By {book.data.author}</span>
                <span>{book.data.edition}</span>
                {book.data.chapter_count && <span>{book.data.chapter_count} chapters</span>}
              </div>

              <p className={styles.pitch}>{book.data.description}</p>

              {book.data.status === 'in-development' ? (
                <p className={styles.devNotice}>
                  <strong>In development.</strong> Sign up for notification when this book launches.
                </p>
              ) : (
                <div className={styles.formats}>
                  {book.data.formats.map((f, i) =>
                    f.type === 'pdf-epub' ? (
                      <BookFormatButton
                        key={i}
                        slug={book.slug}
                        label={f.label}
                        price={f.price}
                      />
                    ) : (
                      <a
                        key={i}
                        href={f.url ?? '#'}
                        target={f.url ? '_blank' : undefined}
                        rel={f.url ? 'noopener' : undefined}
                        className={`${styles.format} ${!f.url ? styles.unavailable : ''}`}
                        data-type={f.type}
                        aria-disabled={!f.url}
                      >
                        <span className={styles.formatType}>{f.label}</span>
                        <span className={styles.formatPrice}>
                          {f.url ? f.price : 'Coming soon'}
                        </span>
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {bodyHtml && (
          <section className={`section container`}>
            <div
              className={styles.proseSection}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </section>
        )}

        {related.length > 0 && (
          <section className="section container">
            <div className={styles.sectionHead}>
              <span className={`eyebrow ${styles.eyebrowAccent}`}>Continue reading</span>
              <h2>Also in {collectionInfo.label}.</h2>
            </div>
            <ul className={`${styles.relatedGrid} ${styles[`count${related.length}`] ?? ''}`}>
              {related.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/books/${b.slug}`}
                    className={styles.relatedCard}
                    style={{ ['--accent-color' as any]: b.data.accent_color }}
                  >
                    <div className={styles.relatedCover}>
                      <img
                        src={b.data.cover_thumb ?? b.data.cover_image}
                        alt={`${b.data.title} cover`}
                        loading="lazy"
                        width={200}
                        height={320}
                      />
                    </div>
                    <div className={styles.relatedMeta}>
                      <span className={styles.position}>{b.data.series_position}</span>
                      <h4>{b.data.title}</h4>
                      <p className={styles.relatedSubtitle}>{b.data.subtitle}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      {book.data.status !== 'in-development' && (
        <MobileBuyBar
          title={book.data.title}
          slug={book.slug}
          formats={book.data.formats}
        />
      )}
    </>
  )
}
