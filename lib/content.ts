import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

// Replaces Astro's `getCollection` / content schema. Reads the markdown
// files under content/{books,toolkits} and parses YAML frontmatter with
// gray-matter. Types mirror the Zod schema that lived in content/config.ts.

export type BookCollection =
  | 'product-deep-dives'
  | 'product-guides'
  | 'cross-platform-skills'
  | 'aegis-toolkits'

export type CoverVariant = 'platform' | 'guide' | 'skills'

export type FormatType = 'pdf-epub' | 'kindle' | 'paperback'

export interface Format {
  type: FormatType
  label: string
  price: string
  url?: string
}

export interface BookData {
  number: number
  title: string
  subtitle: string
  series_position: string
  collection: BookCollection
  cover_variant: CoverVariant
  accent_color: string
  cover_image: string
  cover_thumb?: string
  author: string
  edition: string
  publisher: string
  description: string
  chapter_count: number | null
  page_estimate: string | null
  formats: Format[]
  sample_chapter_url?: string
  related_books?: string[]
  status: 'draft' | 'in-development' | 'published'
}

export interface Book {
  slug: string
  data: BookData
  body: string
}

export interface ToolkitData {
  number: number
  tier: 'starter' | 'standard' | 'pro'
  title: string
  subtitle: string
  collection: 'aegis-toolkits'
  accent_color: string
  cover_image: string
  cover_thumb: string
  author: string
  edition: string
  publisher: string
  description: string
  doc_count: number
  docs: string[]
  formats: Format[]
  status: 'draft' | 'in-development' | 'published'
}

export interface Toolkit {
  slug: string
  data: ToolkitData
  body: string
}

const CONTENT_DIR = path.join(process.cwd(), 'content')

function readCollection<T>(folder: string): { slug: string; data: T; body: string }[] {
  const dir = path.join(CONTENT_DIR, folder)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const filepath = path.join(dir, f)
      const raw = fs.readFileSync(filepath, 'utf8')
      const { data, content } = matter(raw)
      return {
        slug: f.replace(/\.md$/, ''),
        data: data as T,
        body: content,
      }
    })
}

// Default frontmatter values match the old Zod defaults so callers don't
// have to special-case missing fields. Any new file may omit author /
// edition / publisher / status and still render.
function applyBookDefaults(b: Book): Book {
  const data = b.data as Partial<BookData>
  return {
    ...b,
    data: {
      ...(data as BookData),
      author: data.author ?? 'Ken Tannenbaum',
      edition: data.edition ?? '2026 Edition',
      publisher: data.publisher ?? 'Finnoybu Press',
      status: data.status ?? 'published',
    },
  }
}

function applyToolkitDefaults(t: Toolkit): Toolkit {
  const data = t.data as Partial<ToolkitData>
  return {
    ...t,
    data: {
      ...(data as ToolkitData),
      author: data.author ?? 'Ken Tannenbaum',
      edition: data.edition ?? '2026 Edition',
      publisher: data.publisher ?? 'Finnoybu Press',
      status: data.status ?? 'published',
    },
  }
}

let _booksCache: Book[] | null = null
let _toolkitsCache: Toolkit[] | null = null

export function getAllBooks(): Book[] {
  if (_booksCache) return _booksCache
  _booksCache = readCollection<BookData>('books')
    .map(applyBookDefaults)
    .sort((a, b) => a.data.number - b.data.number)
  return _booksCache
}

export function getAllToolkits(): Toolkit[] {
  if (_toolkitsCache) return _toolkitsCache
  _toolkitsCache = readCollection<ToolkitData>('toolkits')
    .map(applyToolkitDefaults)
    .sort((a, b) => a.data.number - b.data.number)
  return _toolkitsCache
}

export function getBook(slug: string): Book | undefined {
  return getAllBooks().find((b) => b.slug === slug)
}

export function getToolkit(slug: string): Toolkit | undefined {
  return getAllToolkits().find((t) => t.slug === slug)
}

export function getBooksInCollection(c: BookCollection): Book[] {
  return getAllBooks().filter((b) => b.data.collection === c)
}
