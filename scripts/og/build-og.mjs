// Builds the social-share OG cards (1200x630 JPGs) and the favicon set
// (favicon.ico + icon.png + apple-icon.png).
//
//   npm run build:og
//
// Each OG card is a layered composition:
//   1. Paper background + accent stripe + typography (rendered from an SVG)
//   2. A staggered, tilted stack of book covers on the right (composited
//      via sharp from JPGs in public/images/)
//   3. The Finnoybu coat of arms in the upper-right corner (small mark)
//
// SVG fonts are vendored under scripts/og/fonts/ so the build is reproducible
// without relying on system font lookup. We use @resvg/resvg-js (not sharp's
// built-in SVG renderer) because it accepts an explicit fontFiles list.

import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const FONT_DIR = path.join(PROJECT, 'scripts', 'og', 'fonts')
const PUBLIC_IMAGES = path.join(PROJECT, 'public', 'images')
const OG_OUT = path.join(PUBLIC_IMAGES, 'og')
const APP_DIR = path.join(PROJECT, 'app')
const COA_PATH = path.join(PROJECT, 'finnoybu_coa_2026a.svg')

const FONT_FILES = [
  path.join(FONT_DIR, 'SourceSerif4-Bold.ttf'),
  path.join(FONT_DIR, 'SourceSerif4-It.ttf'),
  path.join(FONT_DIR, 'SourceSerif4-BoldIt.ttf'),
]

// Brand palette — mirrors :root in app/globals.css.
const COLOR = {
  paper: '#f7f3ec',
  ink900: '#1a1614',
  ink700: '#3a342f',
  ink500: '#6b635a',
  deepDives: '#b34d2c',
  productGuides: '#1f5f6b',
  crossPlatform: '#3a5a3f',
  aegis: '#c9a14a',
  // Series-level cards (home + series) use a neutral ink stripe so they
  // read as the umbrella, not as one collection.
  seriesNeutral: '#1a1614',
}

// COA paths, extracted from finnoybu_coa_2026a.svg. The original has a pair
// of cancelling translate() transforms (Inkscape leftover); they're stripped
// here so the paths render cleanly inside our viewBox.
const COA_VIEWBOX = '0 0 103.447 129.646'
const COA_SHIELD_PATH = 'M 103.31733,0 H 0.12982548 C -3.0065091,105.59923 51.723575,129.64583 51.723575,129.64583 c 0,0 54.730085,-24.0466 51.593755,-129.64583 z'

function loadCoaInnerPath() {
  const raw = fs.readFileSync(COA_PATH, 'utf8')
  const match = raw.match(/<path[\s\S]*?id="path4"[\s\S]*?d="([^"]+)"/)
  if (!match) throw new Error('Could not extract path4 from COA SVG')
  return match[1]
}

const COA_DETAIL_PATH = loadCoaInnerPath()

// 1200x630 OG card layout.
const W = 1200
const H = 630
const STRIPE_W = 28
const PAD_X = 100
const PAD_Y = 80
const TYPE_COL_W = 580 // typography occupies the left column
const COA_W = 64       // small publisher mark, top-right
const COA_H = Math.round(COA_W * (129.646 / 103.447))

// Cover stack layout.
const COVER_W = 220
const COVER_H = Math.round(COVER_W * (2560 / 1600)) // 352, matches book aspect
const STACK_STEP_X = 76  // horizontal stagger between covers
const STACK_STEP_Y = 10  // slight vertical drift
const STACK_TILT_DEGREES = -3.5

function ogBaseSvg({ eyebrow, title, tagline, accent }) {
  const titleLines = title.split('\n')
  const titleStartY = 240
  const titleLineHeight = 84
  const titleSize = 76

  const titleTspans = titleLines
    .map((line, i) => {
      const y = titleStartY + i * titleLineHeight
      return `<text x="${PAD_X}" y="${y}" fill="${COLOR.ink900}" font-family="Source Serif 4" font-weight="700" font-size="${titleSize}" letter-spacing="-2">${escapeXml(line)}</text>`
    })
    .join('\n  ')

  const taglineY = titleStartY + (titleLines.length - 1) * titleLineHeight + 70
  const taglineLines = wrapText(tagline, 44) // narrower wrap because the right side now holds covers
  const taglineLineHeight = 36
  const taglineTspans = taglineLines
    .map((line, i) => {
      const y = taglineY + i * taglineLineHeight
      return `<text x="${PAD_X}" y="${y}" fill="${COLOR.ink700}" font-family="Source Serif 4" font-style="italic" font-weight="400" font-size="26">${escapeXml(line)}</text>`
    })
    .join('\n  ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${COLOR.paper}"/>
  <rect x="0" y="0" width="${STRIPE_W}" height="${H}" fill="${accent}"/>

  <!-- Eyebrow -->
  <text x="${PAD_X}" y="${PAD_Y + 30}"
        fill="${COLOR.ink500}"
        font-family="Source Serif 4" font-weight="700"
        font-size="22" letter-spacing="4">${escapeXml(eyebrow.toUpperCase())}</text>

  <!-- Coat of arms — small publisher mark, top-right corner. -->
  <svg x="${W - PAD_X / 2 - COA_W}" y="${PAD_Y - 20}" width="${COA_W}" height="${COA_H}" viewBox="${COA_VIEWBOX}">
    <path fill="#2678c1" d="${COA_SHIELD_PATH}"/>
    <path fill="#ffffff" d="${COA_DETAIL_PATH}"/>
  </svg>

  <!-- Title -->
  ${titleTspans}

  <!-- Tagline -->
  ${taglineTspans}

  <!-- Footer URL -->
  <text x="${PAD_X}" y="${H - PAD_Y + 10}"
        fill="${COLOR.ink500}"
        font-family="Source Serif 4" font-weight="700"
        font-size="20" letter-spacing="3">PRESS.FINNOYBU.ORG</text>
</svg>`
}

function faviconSvg(size) {
  const inset = Math.round(size * 0.12)
  const innerW = size - inset * 2
  const innerH = innerW * (129.646 / 103.447)
  const innerX = inset
  const innerY = (size - innerH) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${COLOR.paper}" rx="${Math.round(size * 0.18)}"/>
  <svg x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" viewBox="${COA_VIEWBOX}">
    <path fill="#2678c1" d="${COA_SHIELD_PATH}"/>
    <path fill="#ffffff" d="${COA_DETAIL_PATH}"/>
  </svg>
</svg>`
}

function wrapText(text, maxChars) {
  const words = text.split(/\s+/)
  const lines = []
  let current = ''
  for (const w of words) {
    if (!current) current = w
    else if ((current + ' ' + w).length <= maxChars) current = current + ' ' + w
    else { lines.push(current); current = w }
  }
  if (current) lines.push(current)
  return lines
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const CARDS = [
  {
    file: 'home.jpg',
    eyebrow: 'Finnoybu Press',
    title: 'Practical AI\nfor everyone.',
    tagline: 'Twenty-one books on ChatGPT, Claude, Gemini, Copilot, and the cross-platform skills behind useful AI.',
    accent: COLOR.seriesNeutral,
    covers: [
      'cover-01-chatgpt-definitive.jpg',
      'cover-03-claude-definitive.jpg',
      'cover-05-gemini-complete.jpg',
      'cover-07-copilot-workplace.jpg',
      'cover-09-perplexity-research.jpg',
    ],
  },
  {
    file: 'series.jpg',
    eyebrow: 'The Series',
    title: 'AI for\nEveryone.',
    tagline: 'Twenty-one practical books on AI tools, skills, and systems — from your first conversation to fielded governance.',
    accent: COLOR.seriesNeutral,
    covers: [
      'cover-01-chatgpt-definitive.jpg',
      'cover-05-gemini-complete.jpg',
      'cover-11-notebooklm.jpg',
      'cover-16-ai-prompt-engineering.jpg',
      'cover-20-ai-governance.jpg',
    ],
  },
  {
    file: 'product-deep-dives.jpg',
    eyebrow: 'Collection · Books 1–10',
    title: 'Product\nDeep Dives.',
    tagline: 'Comprehensive paired guides for ChatGPT, Claude, Gemini, Copilot, and Perplexity — definitive plus advanced.',
    accent: COLOR.deepDives,
    covers: [
      'cover-01-chatgpt-definitive.jpg',
      'cover-03-claude-definitive.jpg',
      'cover-05-gemini-complete.jpg',
      'cover-07-copilot-workplace.jpg',
      'cover-09-perplexity-research.jpg',
    ],
  },
  {
    file: 'product-guides.jpg',
    eyebrow: 'Collection · Books 11–14',
    title: 'Product\nGuides.',
    tagline: 'Single-volume guides for the next wave — research, reasoning, code, and agentic work.',
    accent: COLOR.productGuides,
    covers: [
      'cover-11-notebooklm.jpg',
      'cover-12-deepseek.jpg',
      'cover-13-cursor.jpg',
      'cover-14-openclaw.jpg',
    ],
  },
  {
    file: 'cross-platform-skills.jpg',
    eyebrow: 'Collection · Books 15–21',
    title: 'Cross-Platform\nSkills.',
    tagline: 'The skills that hold the rest together — prompting, business, developer, governance, and security.',
    accent: COLOR.crossPlatform,
    covers: [
      'cover-15-ai-systems-playbook.jpg',
      'cover-17-ai-for-developers.jpg',
      'cover-19-ai-for-students.jpg',
      'cover-20-ai-governance.jpg',
      'cover-21-securing-agentic-ai.jpg',
    ],
  },
  {
    file: 'aegis-toolkits.jpg',
    eyebrow: 'AEGIS Initiative',
    title: 'AEGIS\nToolkits.',
    tagline: 'Fill-in-the-blank AI governance kits for SMBs. Three tiers — Starter, Standard, Pro.',
    accent: COLOR.aegis,
    covers: [
      'cover-aegis-smb-starter.png',
      'cover-aegis-smb-standard.png',
      'cover-aegis-smb-pro.png',
    ],
  },
]

function renderSvgToPng(svg) {
  const resvg = new Resvg(svg, {
    font: {
      fontFiles: FONT_FILES,
      loadSystemFonts: false,
      defaultFontFamily: 'Source Serif 4',
    },
    background: COLOR.paper,
  })
  return resvg.render().asPng()
}

// Builds the cover stack as a transparent PNG: covers staggered diagonally,
// each with a subtle dark border to separate them visually, then the whole
// composite is rotated by STACK_TILT_DEGREES.
async function buildCoverStack(coverFiles) {
  const n = coverFiles.length
  const stackW = COVER_W + STACK_STEP_X * (n - 1)
  const stackH = COVER_H + STACK_STEP_Y * (n - 1)

  const buffers = await Promise.all(
    coverFiles.map((f) =>
      sharp(path.join(PUBLIC_IMAGES, f))
        .resize(COVER_W, COVER_H, { fit: 'cover' })
        // 1px ink border, expands canvas by 2px each side
        .extend({ top: 1, bottom: 1, left: 1, right: 1, background: COLOR.ink900 })
        .png()
        .toBuffer()
    )
  )

  const composites = buffers.map((buf, i) => ({
    input: buf,
    left: i * STACK_STEP_X,
    top: i * STACK_STEP_Y,
  }))

  const flat = await sharp({
    create: {
      width: stackW + 2,
      height: stackH + 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer()

  // Rotate the whole stack. Sharp expands canvas; we keep the new dimensions
  // and let the caller place it.
  return sharp(flat)
    .rotate(STACK_TILT_DEGREES, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

async function buildCard(card) {
  const baseSvg = ogBaseSvg(card)
  const basePng = renderSvgToPng(baseSvg)

  const stackPng = await buildCoverStack(card.covers)
  const stackMeta = await sharp(stackPng).metadata()

  // Place stack on the right side, slightly below center so the top of the
  // covers clears the small COA mark in the upper-right corner.
  const rightEdge = W - 40
  const left = rightEdge - stackMeta.width
  const top = Math.round((H - stackMeta.height) / 2) + 30

  const composed = await sharp(basePng)
    .composite([{ input: stackPng, left, top }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer()

  fs.writeFileSync(path.join(OG_OUT, card.file), composed)
  console.log(`wrote ${path.relative(PROJECT, path.join(OG_OUT, card.file))}`)
}

async function buildFavicons() {
  const masterSize = 512
  const masterPng = renderSvgToPng(faviconSvg(masterSize))

  await sharp(masterPng).png().toFile(path.join(APP_DIR, 'icon.png'))
  console.log(`wrote app/icon.png (${masterSize}x${masterSize})`)
  await sharp(masterPng).resize(180, 180).png().toFile(path.join(APP_DIR, 'apple-icon.png'))
  console.log('wrote app/apple-icon.png (180x180)')

  const ico16 = await sharp(masterPng).resize(16, 16).png().toBuffer()
  const ico32 = await sharp(masterPng).resize(32, 32).png().toBuffer()
  const ico48 = await sharp(masterPng).resize(48, 48).png().toBuffer()
  const ico = await pngToIco([ico16, ico32, ico48])
  fs.writeFileSync(path.join(APP_DIR, 'favicon.ico'), ico)
  console.log('wrote app/favicon.ico (16/32/48 multi-size)')
}

async function main() {
  fs.mkdirSync(OG_OUT, { recursive: true })
  for (const card of CARDS) await buildCard(card)
  await buildFavicons()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
