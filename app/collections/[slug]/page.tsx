import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BundleCTA from '@/components/BundleCTA'
import { resolveBundleProps } from '@/lib/bundleResolver'
import { getAllBooks, getAllToolkits } from '@/lib/content'
import styles from './page.module.css'

const COLLECTION_BUNDLES: Record<string, string> = {
  'product-deep-dives': 'collection-product-deep-dives',
  'product-guides': 'collection-product-guides',
  'cross-platform-skills': 'collection-cross-platform-skills',
}

interface CollectionMeta {
  slug: string
  eyebrow: string
  title: string
  description: string
  shortDesc: string
  accentColor: string
  source: 'books' | 'toolkits'
}

const COLLECTIONS: Record<string, CollectionMeta> = {
  'product-deep-dives': {
    slug: 'product-deep-dives',
    eyebrow: 'Collection One',
    title: 'Product Deep Dives',
    description:
      'Comprehensive paired guides for the major AI assistants. Each platform gets a definitive guide for new and intermediate users, then an advanced companion for power users who want to push the tool further.',
    shortDesc: 'Paired guides for the major AI assistants.',
    accentColor: 'var(--accent-deep-dives)',
    source: 'books',
  },
  'product-guides': {
    slug: 'product-guides',
    eyebrow: 'Collection Two',
    title: 'Product Guides',
    description:
      'Focused single-volume guides for the next wave of AI tools — research, reasoning, code, and agentic work. Each book covers one product end-to-end, written for the people putting it to work this week.',
    shortDesc: 'Single-volume guides for the next wave of AI tools.',
    accentColor: 'var(--accent-product-guides)',
    source: 'books',
  },
  'cross-platform-skills': {
    slug: 'cross-platform-skills',
    eyebrow: 'Collection Three',
    title: 'Cross-Platform Skills',
    description:
      'The skills that hold the rest together: prompting, AI for business, AI for developers, AI for students, and the governance and security practices behind responsible deployment. Tool-agnostic — what you learn applies wherever you work.',
    shortDesc: 'Skills, roles, and governance — tool-agnostic.',
    accentColor: 'var(--accent-cross-platform)',
    source: 'books',
  },
  'aegis-toolkits': {
    slug: 'aegis-toolkits',
    eyebrow: 'Collection Four · Toolkits',
    title: 'AEGIS™ SMB Governance Toolkits',
    description:
      'Fill-in-the-blank AI governance kits for small and midsize businesses. Three tiers — Starter, Standard, and Pro — sized for real teams, not Fortune 500s. Hand the docs to your team and have a working AI policy by next week.',
    shortDesc: 'Fill-in-the-blank governance kits for SMBs.',
    accentColor: 'var(--accent-aegis)',
    source: 'toolkits',
  },
}

export function generateStaticParams() {
  return Object.keys(COLLECTIONS).map((slug) => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const meta = COLLECTIONS[params.slug]
  if (!meta) return {}
  return { title: meta.title, description: meta.shortDesc }
}

export default function CollectionPage({ params }: { params: { slug: string } }) {
  const meta = COLLECTIONS[params.slug]
  if (!meta) notFound()

  let items: {
    url: string
    cover: string
    coverAlt: string
    eyebrow: string
    title: string
    subtitle: string
    status?: string
  }[]

  if (meta.source === 'books') {
    items = getAllBooks()
      .filter((b) => b.data.collection === params.slug)
      .map((b) => ({
        url: `/books/${b.slug}`,
        cover: b.data.cover_thumb ?? b.data.cover_image,
        coverAlt: `${b.data.title}: ${b.data.subtitle}`,
        eyebrow: b.data.series_position,
        title: b.data.title,
        subtitle: b.data.subtitle,
        status: b.data.status,
      }))
  } else {
    items = getAllToolkits().map((t) => ({
      url: `/toolkits/${t.slug}`,
      cover: t.data.cover_thumb,
      coverAlt: `${t.data.title} — ${t.data.subtitle}`,
      eyebrow: `${t.data.tier.charAt(0).toUpperCase() + t.data.tier.slice(1)} · ${t.data.doc_count} docs`,
      title: t.data.subtitle,
      subtitle: t.data.description.split(/[.!?]\s/)[0] + '.',
      status: t.data.status,
    }))
  }

  const bundleId = COLLECTION_BUNDLES[params.slug]
  const bundleProps = bundleId ? resolveBundleProps(bundleId) : null

  return (
    <article className={styles.page} style={{ ['--accent-color' as any]: meta.accentColor }}>
      <header className={`${styles.pageHero} container`}>
        <Link href="/#collections" className={styles.breadcrumb}>← All collections</Link>
        <span className={`eyebrow ${styles.eyebrowAccent}`}>{meta.eyebrow}</span>
        <h1>{meta.title}</h1>
        <p className={styles.lede}>{meta.description}</p>
      </header>

      {bundleProps && (
        <section className={`container ${styles.bundleSection}`}>
          <BundleCTA {...bundleProps} />
        </section>
      )}

      <section className={`container ${styles.itemSection}`}>
        <ul
          className={`${styles.grid} ${styles[`count${items.length}`] ?? ''} ${
            meta.source === 'toolkits' ? styles.squareThumbs : ''
          }`}
        >
          {items.map((item) => (
            <li key={item.url}>
              <Link href={item.url} className={styles.itemLink}>
                <div className={styles.coverWrap}>
                  <img src={item.cover} alt={item.coverAlt} loading="lazy" />
                </div>
                <div className={styles.itemMeta}>
                  <span className={styles.position}>{item.eyebrow}</span>
                  <h3>{item.title}</h3>
                  <p className={styles.subtitle}>{item.subtitle}</p>
                  {item.status === 'in-development' && (
                    <span className={styles.statusBadge}>In development</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
