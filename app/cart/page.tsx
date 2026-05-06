import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAllBooks, getAllToolkits } from '@/lib/content'
import { BUNDLES, bundleTotalCents } from '@/lib/bundles'
import { priceStringToCents } from '@/lib/cart'
import CartView from '@/components/CartView'

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Your Finnoybu Press cart.',
}

export const dynamic = 'force-dynamic'

export default async function CartPage() {
  let signedIn = false
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      signedIn = !!data.user
    }
  } catch { signedIn = false }

  const allBooks = getAllBooks()
  const allToolkits = getAllToolkits()

  const booksForClient = allBooks.map((b) => {
    const fmt = b.data.formats.find((f) => f.type === 'pdf-epub')
    return {
      slug: b.slug,
      number: b.data.number,
      title: b.data.title,
      subtitle: b.data.subtitle,
      cover_thumb: b.data.cover_thumb || b.data.cover_image,
      accent_color: b.data.accent_color,
      price_cents: priceStringToCents(fmt?.price ?? ''),
    }
  })

  const toolkitsForClient = allToolkits.map((t) => {
    const fmt = t.data.formats.find((f) => f.type === 'pdf-epub')
    return {
      slug: t.slug,
      number: t.data.number,
      tier: t.data.tier,
      title: t.data.title,
      subtitle: t.data.subtitle,
      cover_thumb: t.data.cover_thumb || t.data.cover_image,
      accent_color: t.data.accent_color,
      price_cents: priceStringToCents(fmt?.price ?? ''),
    }
  })

  const bundlesForClient = BUNDLES.map((b) => {
    const totals = bundleTotalCents(b, booksForClient, toolkitsForClient)
    return {
      id: b.id,
      label: b.label,
      description: b.description,
      discountPercent: b.discountPercent,
      accent_color: b.accentColor,
      book_count: totals.included_book_slugs.length,
      toolkit_count: totals.included_toolkit_slugs.length,
      included_book_slugs: totals.included_book_slugs,
      included_toolkit_slugs: totals.included_toolkit_slugs,
      gross_cents: totals.gross_cents,
      net_cents: totals.net_cents,
    }
  })

  return (
    <CartView
      signedIn={signedIn}
      books={booksForClient}
      toolkits={toolkitsForClient}
      bundles={bundlesForClient}
    />
  )
}
