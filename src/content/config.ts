import { defineCollection, z } from 'astro:content';

const books = defineCollection({
  type: 'content',
  schema: z.object({
    // Identity
    number: z.number().int().min(1).max(99),       // 1-21 (catalog position)
    title: z.string(),                             // hero title e.g. "ChatGPT"
    subtitle: z.string(),                          // hero subtitle e.g. "The Definitive Guide"
    series_position: z.string(),                   // "Book One", "Book Eleven", etc.
    // Note: URL slug comes from filename via Astro's auto-slug.
    // See entry.slug or entry.id when iterating the collection.

    // Classification
    collection: z.enum([
      'product-deep-dives',     // 1
      'product-guides',         // 2
      'cross-platform-skills',  // 3
      'aegis-toolkits',         // 4 (toolkits, not books)
    ]),
    cover_variant: z.enum(['platform', 'guide', 'skills']),

    // Visual
    accent_color: z.string(),                      // hex e.g. "#10a37f"
    cover_image: z.string(),                       // path under /public, e.g. "/images/cover-01-chatgpt-definitive.jpg"
    cover_thumb: z.string().optional(),            // small thumb variant for lists

    // Authoring
    author: z.string().default('Ken Tannenbaum'),
    edition: z.string().default('2026 Edition'),
    publisher: z.string().default('Finnoybu Press'),

    // Content meta
    description: z.string(),                       // 1-2 sentence description
    chapter_count: z.number().int().nullable(),    // null if not yet drafted
    page_estimate: z.string().nullable(),          // "~240" or null

    // Buy links
    formats: z.array(z.object({
      type: z.enum(['pdf-epub', 'kindle', 'paperback', 'hardcover']),
      label: z.string(),                           // e.g. "PDF / EPUB"
      price: z.string(),                           // e.g. "$7.99"
      url: z.string().url().optional(),            // missing url = "coming soon"
    })),

    // Editorial extras
    sample_chapter_url: z.string().optional(),     // link to free chapter PDF
    related_books: z.array(z.string()).optional(), // slugs of sibling books

    // Status
    status: z.enum(['draft', 'in-development', 'published']).default('published'),
  }),
});

// Toolkits — AEGIS SMB governance kits. Schema kept compatible with books
// where it makes sense (formats[], accent_color, etc.) so MobileBuyBar etc.
// can be reused, but distinct fields for tier and included docs.
const toolkits = defineCollection({
  type: 'content',
  schema: z.object({
    number: z.number().int().min(1).max(99),       // 1-3 (Starter/Standard/Pro)
    tier: z.enum(['starter', 'standard', 'pro']),
    title: z.string(),                              // e.g. "AEGIS™ SMB Governance Toolkit"
    subtitle: z.string(),                           // e.g. "Starter Edition"

    collection: z.literal('aegis-toolkits'),

    accent_color: z.string(),
    cover_image: z.string(),                        // landscape cover for hero
    cover_thumb: z.string(),                        // square thumb for grids/lists

    author: z.string().default('Ken Tannenbaum'),
    edition: z.string().default('2026 Edition'),
    publisher: z.string().default('Finnoybu Press'),

    description: z.string(),
    doc_count: z.number().int(),
    docs: z.array(z.string()),                      // list of included documents

    formats: z.array(z.object({
      type: z.enum(['pdf-epub', 'kindle', 'paperback', 'hardcover']),
      label: z.string(),
      price: z.string(),
      url: z.string().url().optional(),
    })),

    status: z.enum(['draft', 'in-development', 'published']).default('published'),
  }),
});

export const collections = { books, toolkits };
