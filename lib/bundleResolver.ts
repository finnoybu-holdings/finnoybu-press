import { BUNDLES, bundleTotalCents } from './bundles'
import { priceStringToCents } from './stripe'
import { getAllBooks, getAllToolkits } from './content'

// Resolves a bundle to the props BundleCTA needs. Server-only — reads
// content collections via the filesystem, so do NOT import from a
// client component. Pages pass the result down to <BundleCTA /> as
// plain props.
export function resolveBundleProps(bundleId: string) {
  const bundle = BUNDLES.find((b) => b.id === bundleId)
  if (!bundle) throw new Error(`Unknown bundle: ${bundleId}`)

  const bookCatalog = getAllBooks().map((b) => {
    const fmt = b.data.formats.find((f) => f.type === 'pdf-epub')
    return {
      slug: b.slug,
      number: b.data.number,
      price_cents: priceStringToCents(fmt?.price ?? ''),
    }
  })
  const toolkitCatalog = getAllToolkits().map((t) => {
    const fmt = t.data.formats.find((f) => f.type === 'pdf-epub')
    return {
      slug: t.slug,
      number: t.data.number,
      price_cents: priceStringToCents(fmt?.price ?? ''),
    }
  })

  const totals = bundleTotalCents(bundle, bookCatalog, toolkitCatalog)

  return {
    bundleId: bundle.id,
    label: bundle.label,
    description: bundle.description,
    accentColor: bundle.accentColor,
    discountPercent: bundle.discountPercent,
    grossCents: totals.gross_cents,
    netCents: totals.net_cents,
    includedBooks: totals.included_book_slugs,
    includedToolkits: totals.included_toolkit_slugs,
  }
}
