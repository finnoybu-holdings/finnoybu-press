import type { MetadataRoute } from 'next'
import { getAllBooks, getAllToolkits } from '@/lib/content'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://press.finnoybu.org'

export default function sitemap(): MetadataRoute.Sitemap {
  const books = getAllBooks()
  const toolkits = getAllToolkits()

  const staticPaths = [
    '/',
    '/about',
    '/series',
    '/legal',
    '/collections/product-deep-dives',
    '/collections/product-guides',
    '/collections/cross-platform-skills',
    '/collections/aegis-toolkits',
  ]

  const now = new Date()

  return [
    ...staticPaths.map((p) => ({
      url: `${SITE}${p}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
    })),
    ...books.map((b) => ({
      url: `${SITE}/books/${b.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
    })),
    ...toolkits.map((t) => ({
      url: `${SITE}/toolkits/${t.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
    })),
  ]
}
