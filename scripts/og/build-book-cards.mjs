// Builds per-book social-share OG cards (2400x1260 JPGs) matching the design
// of the existing book cards (books 1-21): an accent top bar, the book cover
// with a soft drop shadow on the left, and an eyebrow / title / subtitle /
// author block on the right in the book's accent colour.
//
//   node scripts/og/build-book-cards.mjs            (all books below)
//   node scripts/og/build-book-cards.mjs codex      (one, by slug)
//
// Data-light on purpose: the per-book metadata is listed here so the script
// runs without parsing content frontmatter. Add a row to BOOKS for new books.

import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const FONT_DIR = path.join(PROJECT, 'scripts', 'og', 'fonts')
const PUBLIC_IMAGES = path.join(PROJECT, 'public', 'images')
const OG_OUT = path.join(PUBLIC_IMAGES, 'og')

const FONT_FILES = [
  path.join(FONT_DIR, 'SourceSerif4-Bold.ttf'),
  path.join(FONT_DIR, 'SourceSerif4-It.ttf'),
  path.join(FONT_DIR, 'SourceSerif4-BoldIt.ttf'),
]

const COLOR = { paper: '#f7f3ec', ink900: '#1a1614', ink700: '#3a342f', ink500: '#6b635a', white: '#ffffff' }

// 2400x1260 (retina 1200x630), matching the existing per-book cards.
const W = 2400, H = 1260
const BAR_H = 116
const PAD = 120

const COVER_W = 560
const COVER_H = Math.round(COVER_W * 1.6) // 896
const COVER_X = 150
const COVER_Y = BAR_H + Math.round((H - BAR_H - COVER_H) / 2)

const COL_X = COVER_X + COVER_W + 180 // right text column
const COL_W = W - COL_X - PAD

const BOOKS = [
  { num: 22, file: 'cover-22-codex.jpg', title: 'Codex', subtitle: 'The Cloud Coding Agent', accent: '#2E7D6B' },
  { num: 23, file: 'cover-23-grok.jpg', title: 'Grok', subtitle: 'Real-Time AI from xAI', accent: '#3B4252' },
  { num: 24, file: 'cover-24-mistral-vibe.jpg', title: 'Mistral', subtitle: 'Vibe and the Open European AI', accent: '#E06A3B' },
  { num: 25, file: 'cover-25-deepl.jpg', title: 'DeepL', subtitle: 'Translation, Writing, and Voice', accent: '#0E4DA4' },
  { num: 26, file: 'cover-26-automate-your-work.jpg', title: 'Automate Your Work with AI', subtitle: 'Zapier, Make, and n8n', accent: '#B45309' },
  { num: 27, file: 'cover-27-build-apps-without-code.jpg', title: 'Build Apps Without Code', subtitle: 'v0, Bolt, Lovable, and Replit', accent: '#6D28D9' },
  { num: 28, file: 'cover-28-ai-literacy.jpg', title: 'AI Literacy for the Workplace', subtitle: 'Judgment, Verification, and Trust', accent: '#1E3A5F' },
]

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function wrapByChars(text, maxChars) {
  const words = text.split(/\s+/)
  const lines = []
  let cur = ''
  for (const w of words) {
    if (!cur) cur = w
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w
    else { lines.push(cur); cur = w }
  }
  if (cur) lines.push(cur)
  return lines
}

function cardSvg(book) {
  const TITLE_SIZE = 132
  const TITLE_LH = 140
  const titleLines = wrapByChars(book.title, 19)
  const titleTop = 460
  const titleTspans = titleLines
    .map((line, i) => `<text x="${COL_X}" y="${titleTop + i * TITLE_LH}" fill="${COLOR.ink900}" font-family="Source Serif 4" font-weight="700" font-size="${TITLE_SIZE}" letter-spacing="-3">${escapeXml(line)}</text>`)
    .join('\n  ')
  const lastTitleY = titleTop + (titleLines.length - 1) * TITLE_LH
  const subtitleY = lastTitleY + 150
  const authorY = subtitleY + 92

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${COLOR.paper}"/>
  <rect x="0" y="0" width="${W}" height="${BAR_H}" fill="${book.accent}"/>
  <text x="${W / 2}" y="${Math.round(BAR_H / 2) + 16}" text-anchor="middle" fill="${COLOR.white}" font-family="Source Serif 4" font-weight="700" font-size="38" letter-spacing="8">FINNOYBU PRESS &#183; AI FOR EVERYONE</text>

  <text x="${COL_X}" y="320" fill="${book.accent}" font-family="Source Serif 4" font-weight="700" font-size="40" letter-spacing="6">BOOK ${book.num} &#183; 2026 EDITION</text>
  ${titleTspans}
  <text x="${COL_X}" y="${subtitleY}" fill="${COLOR.ink700}" font-family="Source Serif 4" font-style="italic" font-weight="400" font-size="54">${escapeXml(book.subtitle)}</text>
  <text x="${COL_X}" y="${authorY}" fill="${COLOR.ink700}" font-family="Source Serif 4" font-style="italic" font-weight="400" font-size="46">by Ken Tannenbaum</text>

  <text x="${COL_X}" y="${H - 80}" fill="${book.accent}" font-family="Source Serif 4" font-weight="700" font-size="34" letter-spacing="4">PRESS.FINNOYBU.ORG</text>
</svg>`
}

function renderSvg(svg) {
  return new Resvg(svg, {
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Source Serif 4' },
    background: COLOR.paper,
  }).render().asPng()
}

async function buildCover(file) {
  const cover = await sharp(path.join(PUBLIC_IMAGES, file))
    .resize(COVER_W, COVER_H, { fit: 'cover' })
    .png()
    .toBuffer()
  // Soft drop shadow: a dark rect, blurred, offset down-right.
  const shadow = await sharp({ create: { width: COVER_W + 80, height: COVER_H + 80, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp({ create: { width: COVER_W, height: COVER_H, channels: 4, background: { r: 26, g: 22, b: 20, alpha: 0.42 } } }).png().toBuffer(), left: 40, top: 40 }])
    .blur(26)
    .png()
    .toBuffer()
  return { cover, shadow }
}

async function buildBook(book) {
  const base = renderSvg(cardSvg(book))
  const { cover, shadow } = await buildCover(book.file)
  const out = path.join(OG_OUT, book.file)
  await sharp(base)
    .composite([
      { input: shadow, left: COVER_X - 40 + 14, top: COVER_Y - 40 + 20 },
      { input: cover, left: COVER_X, top: COVER_Y },
    ])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(out)
  console.log(`wrote ${path.relative(PROJECT, out)}`)
}

async function main() {
  fs.mkdirSync(OG_OUT, { recursive: true })
  const only = process.argv[2]
  const list = only ? BOOKS.filter((b) => b.file.includes(only)) : BOOKS
  if (!list.length) throw new Error(`No book matched "${only}"`)
  for (const b of list) await buildBook(b)
}

main().catch((e) => { console.error(e); process.exit(1) })
