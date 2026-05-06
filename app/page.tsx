import Link from 'next/link'
import CollectionCard from '@/components/CollectionCard'
import HeroCover from '@/components/HeroCover'
import { getAllBooks } from '@/lib/content'
import styles from './page.module.css'

export const revalidate = 3600

export default function HomePage() {
  const sorted = getAllBooks()
  const featured = sorted.find((b) => b.slug === 'chatgpt-definitive')

  const coversFor = (books: typeof sorted) =>
    books.map((b) => ({
      src: b.data.cover_thumb ?? b.data.cover_image,
      alt: `${b.data.title}: ${b.data.subtitle}`,
    }))

  const deepDives = sorted.filter((b) => b.data.collection === 'product-deep-dives')
  const productGuides = sorted.filter((b) => b.data.collection === 'product-guides')
  const skills = sorted.filter((b) => b.data.collection === 'cross-platform-skills')

  const deepDivesCovers = coversFor(deepDives.filter((b) => [1, 3, 5, 7, 9].includes(b.data.number)))
  const skillsCovers = coversFor(skills.filter((b) => [15, 17, 19, 21].includes(b.data.number)))

  return (
    <>
      <header className={`${styles.hero} container`}>
        <div className={styles.heroText}>
          <span className="eyebrow">Finnoybu Press · 2026</span>
          <h1 className={styles.display}>AI guides for every user.</h1>
          <p className="lede">
            Twenty-one practical books on the tools, the skills, and the systems
            behind useful AI — plus governance toolkits for the teams deploying it.
          </p>
          <div className={styles.ctaRow}>
            <Link href="#collections" className="btn">Browse the series</Link>
            {featured && (
              <Link href={`/books/${featured.slug}`} className="btn ghost">
                Start with {featured.data.title} →
              </Link>
            )}
          </div>
          <p className={styles.heroMeta}>A working library by Ken Tannenbaum</p>
        </div>

        {featured && (
          <HeroCover
            className={styles.heroCover}
            src={featured.data.cover_image}
            alt={`${featured.data.title}: ${featured.data.subtitle}`}
          />
        )}
      </header>

      <section className={styles.manifesto}>
        <div className={`container ${styles.manifestoInner}`}>
          <span className="eyebrow">The Publisher&rsquo;s Note</span>
          <p className={styles.manifestoQuote}>
            Most writing about AI is either selling you the future or warning you about it.
            We wanted something else: <em>clear, practical books for the people who actually have to use these tools at work.</em>
          </p>
          <p className={styles.manifestoAttr}>— Ken Tannenbaum, founder</p>
        </div>
      </section>

      <section className="section container" id="collections">
        <div className={styles.sectionHead}>
          <span className="eyebrow">Four Collections</span>
          <h2>A library, organized.</h2>
          <p className="prose">
            The catalog is structured into four collections, each solving a different
            shape of problem — from learning a single tool to standing up governance across a team.
          </p>
        </div>

        <div className={styles.collectionsGrid}>
          <CollectionCard
            eyebrow="Collection One"
            title="Product Deep Dives"
            description="Comprehensive paired guides for the major AI assistants. Start with the definitive guide, then go deeper with the advanced companion."
            href="/collections/product-deep-dives"
            bookCount={deepDives.length}
            bookList="ChatGPT · Claude · Gemini · Copilot · Perplexity"
            accentColor="var(--accent-deep-dives)"
            covers={deepDivesCovers}
          />
          <CollectionCard
            eyebrow="Collection Two"
            title="Product Guides"
            description="Focused single-volume guides for the next wave of AI tools — research, reasoning, code, and agentic work."
            href="/collections/product-guides"
            bookCount={productGuides.length}
            bookList="NotebookLM · DeepSeek · Cursor · OpenClaw"
            accentColor="var(--accent-product-guides)"
            covers={coversFor(productGuides)}
          />
          <CollectionCard
            eyebrow="Collection Three"
            title="Cross-Platform Skills"
            description="The skills that hold the rest together: prompting, AI for business, AI for developers, governance, and security."
            href="/collections/cross-platform-skills"
            bookCount={skills.length}
            bookList="Skills · Roles · Governance"
            accentColor="var(--accent-cross-platform)"
            covers={skillsCovers}
          />
          <CollectionCard
            eyebrow="Collection Four · Toolkits"
            title="AEGIS™ SMB Governance"
            description="Fill-in-the-blank AI governance kits for small and midsize businesses. Three tiers — Starter, Standard, Pro — sized for real teams, not Fortune 500s."
            href="/collections/aegis-toolkits"
            bookCount={3}
            bookList="Starter · Standard · Pro"
            accentColor="var(--accent-aegis)"
            covers={[
              { src: '/images/thumb-aegis-smb-starter.png', alt: 'AEGIS SMB Starter' },
              { src: '/images/thumb-aegis-smb-standard.png', alt: 'AEGIS SMB Standard' },
              { src: '/images/thumb-aegis-smb-pro.png', alt: 'AEGIS SMB Pro' },
            ]}
            ctaLabel="View toolkits →"
            mobileCoverLimit={2}
            itemNoun="toolkit"
          />
        </div>
      </section>
    </>
  )
}
