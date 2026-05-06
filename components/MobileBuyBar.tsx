'use client'

import { useEffect, useRef, useState } from 'react'
import { addToCart, removeFromCart, isInCart, onCartChange } from '@/lib/cart'
import styles from './MobileBuyBar.module.css'

interface Format {
  type: string
  label: string
  price: string
  url?: string
}

interface Props {
  title: string
  slug: string
  formats: Format[]
  itemNoun?: string
}

export default function MobileBuyBar({ title, slug, formats, itemNoun = 'book' }: Props) {
  const [open, setOpen] = useState(false)
  const [inCart, setInCart] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const refresh = () => setInCart(isInCart(slug))
    refresh()
    return onCartChange(refresh)
  }, [slug])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  if (formats.length === 0) return null

  const available = formats.filter((f) => f.url)
  const primary = available[0] ?? formats[0]

  const handlePdfEpub = () => {
    if (isInCart(slug)) removeFromCart(slug)
    else addToCart(slug)
  }

  return (
    <>
      <aside className={styles.bar} aria-label={`Buy ${title}`}>
        <button
          className={styles.trigger}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
        >
          <span className={styles.label}>
            <span className={styles.from}>From</span>
            <span className={styles.price}>{primary.price}</span>
          </span>
          <span className={styles.cta}>Buy this {itemNoun} ↗</span>
        </button>
      </aside>

      <dialog
        ref={dialogRef}
        className={styles.sheet}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false)
        }}
        onClose={() => setOpen(false)}
        aria-label="Choose a format"
      >
        <div className={styles.inner}>
          <header className={styles.head}>
            <h3>{title}</h3>
            <button
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </header>
          <ul className={styles.formats}>
            {formats.map((f, i) => (
              <li key={i}>
                {f.type === 'pdf-epub' ? (
                  <button
                    type="button"
                    className={`${styles.format} ${inCart ? styles.inCart : ''}`}
                    onClick={() => { handlePdfEpub(); setOpen(false) }}
                  >
                    <span className={styles.formatType}>{f.label}</span>
                    <span className={styles.formatPrice}>
                      {inCart ? 'Remove' : f.price}
                    </span>
                  </button>
                ) : f.url ? (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener"
                    className={styles.format}
                    onClick={() => setOpen(false)}
                  >
                    <span className={styles.formatType}>{f.label}</span>
                    <span className={styles.formatPrice}>{f.price}</span>
                  </a>
                ) : (
                  <span className={`${styles.format} ${styles.unavailable}`}>
                    <span className={styles.formatType}>{f.label}</span>
                    <span className={styles.formatPrice}>Coming soon</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  )
}
