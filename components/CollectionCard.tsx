import Link from 'next/link'
import styles from './CollectionCard.module.css'

interface CoverItem {
  src: string
  alt: string
}

interface Props {
  eyebrow: string
  title: string
  description: string
  href: string
  bookCount: number
  bookList: string
  accentColor: string
  covers: CoverItem[]
  ctaLabel?: string
  mobileCoverLimit?: number
  itemNoun?: string
}

export default function CollectionCard({
  eyebrow,
  title,
  description,
  href,
  bookCount,
  bookList,
  accentColor,
  covers,
  ctaLabel = 'View collection →',
  mobileCoverLimit,
  itemNoun = 'book',
}: Props) {
  const stackClass = `${styles.stack}${
    mobileCoverLimit ? ` ${styles[`stackMobile${mobileCoverLimit}`]}` : ''
  }`
  return (
    <Link href={href} className={styles.card} style={{ ['--accent-color' as any]: accentColor }}>
      <span className={`eyebrow ${styles.eyebrowAccent}`}>{eyebrow}</span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>

      <div className={stackClass}>
        {covers.map((c, i) => (
          <img key={i} src={c.src} alt={c.alt} loading="lazy" width={80} height={128} />
        ))}
      </div>

      <div className={styles.meta}>
        <span>
          {bookCount} {bookCount === 1 ? itemNoun : `${itemNoun}s`} · {bookList}
        </span>
        <span className={styles.arrow}>{ctaLabel}</span>
      </div>
    </Link>
  )
}
