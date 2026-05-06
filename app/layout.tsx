import './globals.css'
import type { Metadata } from 'next'
import { Source_Serif_4, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'
import AuthModal from '@/components/AuthModal'
import { AuthModalProvider } from '@/components/AuthModalContext'

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://press.finnoybu.org'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Finnoybu Press',
    template: '%s — Finnoybu Press',
  },
  description:
    'Finnoybu Press publishes clear, practical guides to AI tools and governance. Twenty-one books on ChatGPT, Claude, Gemini, Copilot, Perplexity, plus the cross-platform skills behind useful AI.',
  authors: [{ name: 'Ken Tannenbaum' }],
  publisher: 'Finnoybu Press',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Finnoybu Press',
    locale: 'en_US',
    url: '/',
    images: [{ url: '/images/og-card.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/images/og-card.png'],
  },
}

const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Finnoybu Press',
  legalName: 'Finnoybu Holdings LLC',
  url: 'https://press.finnoybu.org',
  logo: 'https://press.finnoybu.org/images/og-card.png',
  description: 'Publisher of practical AI guides and governance toolkits.',
  founder: { '@type': 'Person', name: 'Ken Tannenbaum' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }}
        />
      </head>
      <body>
        <AuthModalProvider>
          <Nav />
          <main>{children}</main>
          <Footer />
          <AuthModal />
          <CookieBanner />
        </AuthModalProvider>
        <Analytics />
      </body>
    </html>
  )
}
