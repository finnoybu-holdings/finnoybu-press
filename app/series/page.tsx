import Link from 'next/link'
import type { Metadata } from 'next'
import BundleCTA from '@/components/BundleCTA'
import { getAllBooks } from '@/lib/content'
import { resolveBundleProps } from '@/lib/bundleResolver'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'The AI for Everyone Series',
  description:
    'Twenty-one practical books on AI tools, skills, and systems. Browse the full series.',
}

const COLLECTION_LABELS: Record<string, string> = {
  'product-deep-dives': 'Product Deep Dives',
  'product-guides': 'Product Guides',
  'cross-platform-skills': 'Cross-Platform Skills',
}

const COLLECTION_DESCRIPTIONS: Record<string, string> = {
  'product-deep-dives':
    'Comprehensive paired guides for the major AI assistants. Definitive guide + advanced companion for each platform.',
  'product-guides':
    'Focused single-volume guides for the next wave of AI tools — research, reasoning, code, and agentic work.',
  'cross-platform-skills':
    'The skills that hold the rest together: prompting, AI for business, AI for developers, governance, and security.',
}

const ORDER = ['product-deep-dives', 'product-guides', 'cross-platform-skills']

export default function SeriesPage() {
  const books = getAllBooks()
  const groups: Record<string, typeof books> = {}
  for (const b of books) {
    if (b.data.collection === 'aegis-toolkits') continue
    ;(groups[b.data.collection] = groups[b.data.collection] || []).push(b)
  }

  const seriesBundle = resolveBundleProps('series-complete')

  return (
    <>
      <header className={`${styles.pageHero} container`}>
        <span className="eyebrow">The Series</span>
        <h1>AI for Everyone.</h1>
        <p className="lede">
          Twenty-one books across three collections. Each book is written to be useful on day one and to serve as a reference you come back to.
        </p>
      </header>

      <section className={`container ${styles.bundleSection}`}>
        <BundleCTA {...seriesBundle} />
      </section>

      {ORDER.map((cid) => {
        const list = groups[cid] ?? []
        if (list.length === 0) return null
        return (
          <section key={cid} className={`${styles.section} container`}>
            <div className={styles.sectionHead}>
              <span className="eyebrow">{COLLECTION_LABELS[cid]} · {list.length} books</span>
              <p className="prose">{COLLECTION_DESCRIPTIONS[cid]}</p>
            </div>

            <ul className={styles.grid}>
              {list.map((b) => (
                <li key={b.slug} className={styles.gridItem}>
                  <Link
                    href={`/books/${b.slug}`}
                    className={styles.bookLink}
                    style={{ ['--accent-color' as any]: b.data.accent_color }}
                  >
                    <div className={styles.coverWrap}>
                      <img
                        src={b.data.cover_thumb ?? b.data.cover_image}
                        alt={`${b.data.title}: ${b.data.subtitle}`}
                        loading="lazy"
                        width={160}
                        height={256}
                      />
                    </div>
                    <div className={styles.bookMeta}>
                      <span className={styles.position}>{b.data.series_position}</span>
                      <h3>{b.data.title}</h3>
                      <p className={styles.subtitle}>{b.data.subtitle}</p>
                      {b.data.status === 'in-development' && (
                        <span className={styles.statusBadge}>In development</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
