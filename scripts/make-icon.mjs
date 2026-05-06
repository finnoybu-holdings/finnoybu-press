// Builds the Facebook (and reusable) app icon — 1024x1024 PNG with
// transparent background. Wordmark "Finnoybu Press" at the top, four
// platform-flagship book covers below, staggered down-and-right with
// a gentle counter-clockwise tilt on the whole stack.
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'

const PROJECT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '')), '..')
const PUBLIC_IMAGES = path.join(PROJECT, 'public', 'images')

const COVERS = [
  'cover-01-chatgpt-definitive.jpg',
  'cover-03-claude-definitive.jpg',
  'cover-05-gemini-complete.jpg',
  'cover-07-copilot-workplace.jpg',
  'cover-09-perplexity-research.jpg',
]

const CANVAS = 1024
const COVER_W = 280
const COVER_H = Math.round(COVER_W * 1.6) // 448
const STEP_X = 155
const STEP_Y = 26
const TILT_DEGREES = -3

const stackWidth = COVER_W + STEP_X * (COVERS.length - 1)
const stackHeight = COVER_H + STEP_Y * (COVERS.length - 1)
const startX = Math.round((CANVAS - stackWidth) / 2)
const stackTop = Math.round(CANVAS * 0.32) // leave ~32% of the canvas for the wordmark

async function buildCover(file) {
  const src = path.join(PUBLIC_IMAGES, file)
  if (!fs.existsSync(src)) throw new Error(`Cover not found: ${src}`)
  return sharp(src)
    .resize(COVER_W, COVER_H, { fit: 'cover' })
    .extend({ top: 1, bottom: 1, left: 1, right: 1, background: '#1a1614' })
    .png()
    .toBuffer()
}

async function main() {
  const buffers = await Promise.all(COVERS.map(buildCover))

  const composites = buffers.map((buf, i) => ({
    input: buf,
    left: startX + i * STEP_X,
    top: stackTop + i * STEP_Y,
  }))

  // Wordmark — SVG text rendered to PNG, centered at the top of the canvas.
  // Using a serif fallback chain because Source Serif 4 may not be available
  // on every system librsvg falls back to. Georgia is close enough for an
  // icon; visual diff at this scale is minimal.
  const wordmarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="220" viewBox="0 0 ${CANVAS} 220">
    <text x="${CANVAS / 2}" y="160"
          text-anchor="middle"
          font-family="Source Serif 4, Source Serif Pro, Georgia, serif"
          font-size="130"
          font-weight="700"
          letter-spacing="-3"
          fill="#1a1614">Finnoybu Press</text>
  </svg>`

  // Lay covers + wordmark on a transparent canvas.
  const stacked = await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: Buffer.from(wordmarkSvg), top: 40, left: 0 },
      ...composites,
    ])
    .png()
    .toBuffer()

  // Tilt the whole composition slightly. Sharp expands the canvas during
  // rotation; re-extract a 1024 center crop to keep the size correct.
  const rotated = await sharp(stacked)
    .rotate(TILT_DEGREES, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  const meta = await sharp(rotated).metadata()
  const cropX = Math.round((meta.width - CANVAS) / 2)
  const cropY = Math.round((meta.height - CANVAS) / 2)

  await sharp(rotated)
    .extract({ left: cropX, top: cropY, width: CANVAS, height: CANVAS })
    .png()
    .toFile('d:/tmp/finnoybu-press-icon-1024.png')

  console.log('Wrote d:/tmp/finnoybu-press-icon-1024.png (1024x1024 transparent)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
