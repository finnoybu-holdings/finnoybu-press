// Bundle definitions for collection + series purchases at a discount.
//
// Each bundle is identified by a stable `id` string. Cart items reference
// bundles by id (kind: 'bundle'); resolved at render/checkout time against
// the books and toolkits content collections.
//
// Pricing: sum of included items × (1 - discountPercent/100), then charm-rounded
// UP to the next price ending in 9 cents (see bundleTotalCents).

export interface Bundle {
  id: string;
  label: string;
  description: string;
  bookNumbers: number[];     // book.data.number values to include
  toolkitSlugs: string[];    // toolkit slugs to include
  discountPercent: number;   // 10 or 25
  accentColor: string;
}

// All bundles cover the PDF + ePub edition only. Paperback and Kindle
// remain individual purchases through their respective channels.
export const BUNDLES: Bundle[] = [
  {
    id: 'collection-product-deep-dives',
    label: 'Collection One — Product Deep Dives (PDF + ePub)',
    description: 'All ten paired guides for ChatGPT, Claude, Gemini, Copilot, and Perplexity. PDF + ePub editions only.',
    bookNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    toolkitSlugs: [],
    discountPercent: 15,
    accentColor: '#c44a30',
  },
  {
    id: 'collection-product-guides',
    label: 'Collection Two — Product Guides (PDF + ePub)',
    description: 'Single-volume guides for NotebookLM, DeepSeek, Cursor, and OpenClaw. PDF + ePub editions only.',
    bookNumbers: [11, 12, 13, 14],
    toolkitSlugs: [],
    discountPercent: 10,
    accentColor: '#1c5d99',
  },
  {
    id: 'collection-cross-platform-skills',
    label: 'Collection Three — Cross-Platform Skills (PDF + ePub)',
    description: 'Seven cross-platform skills books from systems and prompting through governance and security. PDF + ePub editions only.',
    bookNumbers: [15, 16, 17, 18, 19, 20, 21],
    toolkitSlugs: [],
    discountPercent: 12.5,
    accentColor: '#2e8a5f',
  },
  {
    id: 'collection-product-guides-ii',
    label: 'Collection Four — Product Guides, Vol. II (PDF + ePub)',
    description: 'The next four single-product guides — Codex, Grok, Mistral, and DeepL. PDF + ePub editions only.',
    bookNumbers: [22, 23, 24, 25],
    toolkitSlugs: [],
    discountPercent: 10,
    accentColor: '#1c5d99',
  },
  {
    id: 'collection-capability-set',
    label: 'Collection Five — The Capability Set (PDF + ePub)',
    description: 'Three cross-platform capability books — automating your work, building apps without code, and AI literacy for the workplace. PDF + ePub editions only.',
    bookNumbers: [26, 27, 28],
    toolkitSlugs: [],
    discountPercent: 10,
    accentColor: '#2e8a5f',
  },
  {
    id: 'series-complete',
    label: 'The Complete Series (PDF + ePub)',
    description: 'All 28 books across the AI for Everyone series — at 25% off. PDF + ePub editions only; paperback sold separately.',
    bookNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
    toolkitSlugs: [],
    discountPercent: 25,
    accentColor: '#1c1814',
  },
];

export function getBundle(id: string): Bundle | undefined {
  return BUNDLES.find((b) => b.id === id);
}

export interface CatalogItem {
  slug: string;
  number?: number;
  price_cents: number;
}

export function bundleTotalCents(
  bundle: Bundle,
  books: CatalogItem[],
  toolkits: CatalogItem[]
): { gross_cents: number; net_cents: number; included_book_slugs: string[]; included_toolkit_slugs: string[] } {
  const includedBooks = books.filter((b) => b.number !== undefined && bundle.bookNumbers.includes(b.number));
  const includedToolkits = toolkits.filter((t) => bundle.toolkitSlugs.includes(t.slug));
  const gross = [...includedBooks, ...includedToolkits].reduce((sum, it) => sum + it.price_cents, 0);
  // Charm pricing: round the discounted total UP to the next price ending in 9
  // cents (e.g. $67.92 → $67.99, $28.76 → $28.79) — ceil to the next 10-cent
  // step, then drop a cent.
  const net = Math.ceil((gross * (1 - bundle.discountPercent / 100)) / 10) * 10 - 1;
  return {
    gross_cents: gross,
    net_cents: net,
    included_book_slugs: includedBooks.map((b) => b.slug),
    included_toolkit_slugs: includedToolkits.map((t) => t.slug),
  };
}
