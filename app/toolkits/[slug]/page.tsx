import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import BookFormatButton from '@/components/BookFormatButton'
import MobileBuyBar from '@/components/MobileBuyBar'
import { getAllToolkits, getToolkit } from '@/lib/content'
import styles from './page.module.css'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://press.finnoybu.org'

export function generateStaticParams() {
  return getAllToolkits().map((t) => ({ slug: t.slug }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const tk = getToolkit(params.slug)
  if (!tk) return {}
  const ogImage = tk.data.cover_image.replace('/images/', '/images/og/').replace('.png', '.jpg')
  const url = `/toolkits/${params.slug}`
  return {
    title: `${tk.data.title} — ${tk.data.subtitle}`,
    description: tk.data.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: `${tk.data.title} — ${tk.data.subtitle}`,
      description: tk.data.description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      images: [ogImage],
    },
  }
}

export default function ToolkitPage({ params }: { params: { slug: string } }) {
  const tk = getToolkit(params.slug)
  if (!tk) notFound()

  const related = getAllToolkits().filter((t) => t.slug !== tk.slug)

  const paidOffers = tk.data.formats.filter((f) => f.url)
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${tk.data.title} — ${tk.data.subtitle}`,
    description: tk.data.description,
    image: new URL(tk.data.cover_image, SITE).toString(),
    brand: { '@type': 'Brand', name: tk.data.publisher },
    category: 'AI Governance / Compliance Toolkit',
    url: `${SITE}/toolkits/${tk.slug}`,
    ...(paidOffers.length > 0 && {
      offers: paidOffers.map((f) => ({
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: f.price.replace(/[^0-9.]/g, ''),
        url: f.url,
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
      })),
    }),
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Tier', value: tk.data.tier },
      { '@type': 'PropertyValue', name: 'Document count', value: tk.data.doc_count },
      { '@type': 'PropertyValue', name: 'Edition', value: tk.data.edition },
    ],
  }

  const bodyHtml = tk.body && tk.body.trim().length > 0 ? marked.parse(tk.body) : ''

  const tierLabel = tk.data.tier.charAt(0).toUpperCase() + tk.data.tier.slice(1)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <article
        className={styles.page}
        style={{ ['--accent-color' as any]: tk.data.accent_color }}
      >
        <header className={`${styles.toolkitHero} container`}>
          <div className={styles.heroMeta}>
            <Link href="/collections/aegis-toolkits" className={styles.breadcrumb}>
              ← AEGIS Toolkits
            </Link>
            <span className={`eyebrow ${styles.eyebrowAccent}`}>
              {tierLabel} Edition · {tk.data.doc_count} docs
            </span>
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.coverStage}>
              <img
                src={tk.data.cover_image}
                alt={`${tk.data.title} ${tk.data.subtitle}`}
                className={styles.cover}
                loading="eager"
                width={640}
                height={360}
              />
            </div>

            <div className={styles.heroText}>
              <h1>{tk.data.title}</h1>
              <p className={styles.subtitle}>{tk.data.subtitle}</p>

              <div className={styles.byline}>
                <span>By {tk.data.author}</span>
                <span>{tk.data.edition}</span>
              </div>

              <p className={styles.pitch}>{tk.data.description}</p>

              <div className={styles.formats}>
                {tk.data.formats.map((f, i) =>
                  f.type === 'pdf-epub' ? (
                    <BookFormatButton
                      key={i}
                      slug={tk.slug}
                      label={f.label}
                      price={f.price}
                      kind="toolkit"
                    />
                  ) : (
                    <a
                      key={i}
                      href={f.url ?? '#'}
                      target={f.url ? '_blank' : undefined}
                      rel={f.url ? 'noopener' : undefined}
                      className={`${styles.format} ${!f.url ? styles.unavailable : ''}`}
                      data-type={f.type}
                    >
                      <span className={styles.formatType}>{f.label}</span>
                      <span className={styles.formatPrice}>
                        {f.url ? f.price : 'Coming soon'}
                      </span>
                    </a>
                  )
                )}
              </div>
            </div>
          </div>
        </header>

        <section className="section container">
          <div className={styles.sectionHead}>
            <span className={`eyebrow ${styles.eyebrowAccent}`}>What&rsquo;s inside</span>
            <h2>{tk.data.doc_count} fill-in-the-blank documents.</h2>
          </div>
          <ul className={styles.docList}>
            {tk.data.docs.map((d, i) => (
              <li key={i}>
                <span className={styles.docNum}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.docName}>{d}</span>
              </li>
            ))}
          </ul>
        </section>

        {bodyHtml && (
          <section className="section container">
            <div
              className={styles.proseSection}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </section>
        )}

        {related.length > 0 && (
          <section className="section container">
            <div className={styles.sectionHead}>
              <span className={`eyebrow ${styles.eyebrowAccent}`}>Other tiers</span>
              <h2>Compare with the rest of the AEGIS line.</h2>
            </div>
            <ul className={styles.relatedGrid}>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/toolkits/${r.slug}`}
                    className={styles.relatedCard}
                    style={{ ['--accent-color' as any]: r.data.accent_color }}
                  >
                    <div className={styles.relatedCover}>
                      <img src={r.data.cover_thumb} alt={r.data.title} loading="lazy" />
                    </div>
                    <div className={styles.relatedMeta}>
                      <span className={styles.position}>
                        {r.data.tier.charAt(0).toUpperCase() + r.data.tier.slice(1)} · {r.data.doc_count} docs
                      </span>
                      <h4>{r.data.subtitle}</h4>
                      <p className={styles.relatedSubtitle}>
                        {r.data.description.split(/[.!?]\s/)[0] + '.'}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <MobileBuyBar
        title={`${tk.data.title} — ${tk.data.subtitle}`}
        slug={tk.slug}
        formats={tk.data.formats}
        itemNoun="toolkit"
      />
    </>
  )
}
