import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://press.finnoybu.org'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/account/', '/auth/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
