// Builds AEGIS Enterprise Toolkit cover art — landscape (1280x720) and
// square thumb (600x600), matching the design language of the SMB Governance
// Kit covers (cover-aegis-smb-{starter,standard,pro}.png).
//
// Output:
//   public/images/cover-aegis-enterprise.png   1280x720
//   public/images/thumb-aegis-enterprise.png    600x600
//
// Run:
//   node scripts/build-enterprise-cover.mjs
//
// Sharp is used for SVG → PNG. Text is rendered with the librsvg fallback
// chain (Source Serif 4 → Georgia), matching make-icon.mjs convention.
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(PROJECT, 'public', 'images');

// Brand palette
const BG = '#0a1428';            // deep navy (matches SMB covers)
const SHIELD_STROKE = '#3a4a60'; // muted slate for shield outline
const ACCENT = '#d4dce5';        // platinum — Enterprise tier color
const WORDMARK = '#f0f4f8';      // warm white
const MUTED = '#8a99b3';         // body / price
const FOOTER = '#5e6b85';        // footer text
const DIVIDER = '#3a4a60';       // wordmark side rules

// Shield path — Finnoybu coat-of-arms outline, reused as AEGIS shield.
// Original viewBox: 0 0 103.447 129.646 (from finnoybu_coa_2026a.svg).
const SHIELD_PATH = 'M 103.31733,0 H 0.12982548 C -3.0065091,105.59923 51.723575,129.64583 51.723575,129.64583 c 0,0 54.730085,-24.0466 51.593755,-129.64583 z';
const SHIELD_W_RAW = 103.447;
const SHIELD_H_RAW = 129.646;

function shieldGroup({ cx, cy, height }) {
  // Scale the shield so its rendered height equals `height`.
  const scale = height / SHIELD_H_RAW;
  const w = SHIELD_W_RAW * scale;
  const x = cx - w / 2;
  const y = cy - height / 2;
  // Diamond inside — two overlapping rhombs (outline + fill) for the
  // faceted look the SMB covers use. Diamond half-extent ~ 26% of shield
  // height, centered horizontally and a touch above geometric center.
  const dCx = cx;
  const dCy = cy - height * 0.05;
  const dOuter = height * 0.30;  // outer rhomb half-diagonal
  const dInner = height * 0.22;  // inner rhomb half-diagonal
  return `
  <g transform="translate(${x},${y}) scale(${scale})">
    <path d="${SHIELD_PATH}" fill="none" stroke="${SHIELD_STROKE}" stroke-width="2.5" />
  </g>
  <!-- Diamond outline -->
  <polygon points="${dCx},${dCy - dOuter} ${dCx + dOuter * 0.78},${dCy} ${dCx},${dCy + dOuter} ${dCx - dOuter * 0.78},${dCy}"
           fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linejoin="round" />
  <!-- Diamond inner fill -->
  <polygon points="${dCx},${dCy - dInner} ${dCx + dInner * 0.78},${dCy} ${dCx},${dCy + dInner} ${dCx - dInner * 0.78},${dCy}"
           fill="${ACCENT}" opacity="0.18" />`;
}

function landscapeSvg() {
  const W = 1280;
  const H = 720;
  const shieldH = 180;
  const shieldCx = W / 2;
  const shieldCy = 170;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG}" />
  ${shieldGroup({ cx: shieldCx, cy: shieldCy, height: shieldH })}

  <!-- AEGIS wordmark with side rules -->
  <line x1="440" y1="410" x2="540" y2="410" stroke="${DIVIDER}" stroke-width="1" />
  <line x1="740" y1="410" x2="840" y2="410" stroke="${DIVIDER}" stroke-width="1" />
  <text x="${W / 2}" y="425" text-anchor="middle"
        font-family="Source Serif 4, Source Serif Pro, Georgia, serif"
        font-size="56" font-weight="500" letter-spacing="18" fill="${WORDMARK}">AEGIS</text>

  <!-- Short underline -->
  <line x1="${W / 2 - 70}" y1="455" x2="${W / 2 + 70}" y2="455" stroke="${ACCENT}" stroke-width="1" opacity="0.5" />

  <!-- Subtitle -->
  <text x="${W / 2}" y="500" text-anchor="middle"
        font-family="Inter, -apple-system, 'Segoe UI', sans-serif"
        font-size="22" font-weight="400" fill="${MUTED}">AI Governance Kit</text>

  <!-- Pill badge -->
  <rect x="${W / 2 - 115}" y="540" width="230" height="46" rx="23" ry="23"
        fill="none" stroke="${ACCENT}" stroke-width="1.5" />
  <text x="${W / 2}" y="570" text-anchor="middle"
        font-family="Inter, -apple-system, 'Segoe UI', sans-serif"
        font-size="14" font-weight="600" letter-spacing="7" fill="${ACCENT}">ENTERPRISE</text>

  <!-- Price -->
  <text x="${W / 2}" y="630" text-anchor="middle"
        font-family="Source Serif 4, Source Serif Pro, Georgia, serif"
        font-size="30" font-weight="400" fill="${MUTED}">$34.99</text>

  <!-- Footer -->
  <text x="${W / 2}" y="695" text-anchor="middle"
        font-family="Inter, -apple-system, 'Segoe UI', sans-serif"
        font-size="11" font-weight="500" letter-spacing="4" fill="${FOOTER}">AEGIS INITIATIVE  |  aegis-initiative.com</text>
</svg>`;
}

function thumbSvg() {
  // Square version, condensed vertically. 600x600.
  const S = 600;
  const shieldH = 150;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <rect width="${S}" height="${S}" fill="${BG}" />
  ${shieldGroup({ cx: S / 2, cy: 165, height: shieldH })}

  <!-- AEGIS wordmark with side rules -->
  <line x1="120" y1="320" x2="200" y2="320" stroke="${DIVIDER}" stroke-width="1" />
  <line x1="400" y1="320" x2="480" y2="320" stroke="${DIVIDER}" stroke-width="1" />
  <text x="${S / 2}" y="333" text-anchor="middle"
        font-family="Source Serif 4, Source Serif Pro, Georgia, serif"
        font-size="42" font-weight="500" letter-spacing="14" fill="${WORDMARK}">AEGIS</text>

  <line x1="${S / 2 - 55}" y1="358" x2="${S / 2 + 55}" y2="358" stroke="${ACCENT}" stroke-width="1" opacity="0.5" />

  <text x="${S / 2}" y="398" text-anchor="middle"
        font-family="Inter, -apple-system, 'Segoe UI', sans-serif"
        font-size="18" font-weight="400" fill="${MUTED}">AI Governance Kit</text>

  <rect x="${S / 2 - 95}" y="430" width="190" height="40" rx="20" ry="20"
        fill="none" stroke="${ACCENT}" stroke-width="1.5" />
  <text x="${S / 2}" y="456" text-anchor="middle"
        font-family="Inter, -apple-system, 'Segoe UI', sans-serif"
        font-size="12" font-weight="600" letter-spacing="6" fill="${ACCENT}">ENTERPRISE</text>

  <text x="${S / 2}" y="510" text-anchor="middle"
        font-family="Source Serif 4, Source Serif Pro, Georgia, serif"
        font-size="24" font-weight="400" fill="${MUTED}">$34.99</text>

  <text x="${S / 2}" y="572" text-anchor="middle"
        font-family="Inter, -apple-system, 'Segoe UI', sans-serif"
        font-size="9" font-weight="500" letter-spacing="3" fill="${FOOTER}">AEGIS INITIATIVE  |  aegis-initiative.com</text>
</svg>`;
}

async function render(svg, outPath) {
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`Wrote ${outPath}`);
}

async function main() {
  await render(landscapeSvg(), path.join(OUT_DIR, 'cover-aegis-enterprise.png'));
  await render(thumbSvg(), path.join(OUT_DIR, 'thumb-aegis-enterprise.png'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
