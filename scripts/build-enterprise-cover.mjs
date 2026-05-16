// Builds AEGIS Enterprise Toolkit cover art:
//
//   public/images/cover-aegis-enterprise.png   1600x900 (from source SVG)
//   public/images/thumb-aegis-enterprise.png    600x600 (custom square layout)
//
// Source landscape SVG: scripts/og/sources/cover-aegis-enterprise.svg
// (committed in-repo so the build is reproducible from any clone).
//
// The thumbnail is hand-laid-out to fit the square frame using the same
// visual elements as the landscape — same gradients, same shield paths,
// same typography, just repositioned. Sharp's librsvg renders both.
//
// Run:  node scripts/build-enterprise-cover.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_SVG = path.join(PROJECT, 'scripts', 'og', 'sources', 'cover-aegis-enterprise.svg');
const OUT_DIR = path.join(PROJECT, 'public', 'images');

// Shield paths extracted from the source SVG. Kept here so the thumb can
// recompose them at a different scale + position.
const SHIELD_OUTER = 'm 36.662936,113.392 c -0.162667,4.42267 -0.245333,8.836 -0.245333,13.18133 0,132.18667 72.177327,252.30666 188.633327,314.43333 116.45467,-62.12667 188.632,-182.24533 188.632,-314.43333 0,-4.344 -0.0827,-8.75733 -0.24534,-13.18133 C 346.49759,103.04 281.6016,77.890668 225.05093,40.378668 168.49893,77.890668 103.60293,103.04 36.662936,113.392 M 217.5696,474.55466 C 154.13227,442.57066 100.58293,393.82533 62.709602,333.58933 23.77227,271.65733 3.1896035,200.072 3.1896035,126.57333 c 0,-9.54 0.3613333,-19.28666 1.0733333,-28.967996 L 5.2616035,84.010667 18.789603,82.336001 C 89.205601,73.613334 157.23627,47.446668 215.52693,6.6640027 L 225.0496,2.8348e-6 234.57493,6.6626693 c 58.288,40.7839987 126.31866,66.9506647 196.73733,75.6746647 l 13.524,1.673333 1.00133,13.593333 c 0.712,9.67333 1.07334,19.42 1.07334,28.96933 0,73.49867 -20.58134,145.08267 -59.52134,207.016 -37.86933,60.23466 -91.41866,108.98 -154.85866,140.96666 l -7.48,3.772 z';
const SHIELD_INNER = 'm 225.0504,316.1296 -102.54,-131.09733 102.54,-131.09733 102.54,131.09733 z m 0,-316.1293254301 L 80.327737,185.03227 225.0504,370.06427 369.77306,185.03227 Z';

// Shield path bounding box in source coords ≈ (3, 0) to (447, 475);
// visual center ≈ (225, 237.5). Used by the thumb to position the shield.
const SHIELD_CX_RAW = 225;
const SHIELD_CY_RAW = 237.5;

function thumbSvg() {
  const S = 600;
  const cx = S / 2;

  // Shield: scale so its rendered height is ~140px, center horizontally.
  const shieldH = 140;
  const shieldScale = shieldH / 475;
  const shieldCenterY = 130;
  const tx = cx - SHIELD_CX_RAW * shieldScale;
  const ty = shieldCenterY - SHIELD_CY_RAW * shieldScale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0f1a"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="purple" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#874CF7"/>
      <stop offset="50%" stop-color="#7B3AEC"/>
      <stop offset="100%" stop-color="#6B2ADB"/>
    </linearGradient>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#ffffff" stroke-opacity="0.03" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <rect width="${S}" height="${S}" fill="url(#grid)"/>

  <!-- Top + bottom accent bars -->
  <rect x="0" y="0" width="${S}" height="3" fill="url(#purple)"/>
  <rect x="0" y="${S - 3}" width="${S}" height="3" fill="url(#purple)"/>

  <!-- Shield -->
  <g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${shieldScale.toFixed(4)})">
    <path style="fill:#ffffff;fill-opacity:0.15;fill-rule:nonzero" d="${SHIELD_OUTER}"/>
    <path style="fill:url(#purple);fill-opacity:1;fill-rule:nonzero" d="${SHIELD_INNER}"/>
  </g>

  <!-- AEGIS wordmark -->
  <text x="${cx}" y="345" text-anchor="middle"
        font-family="'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
        font-size="46" font-weight="300" letter-spacing="11"
        fill="#ffffff" opacity="0.9">AEGIS</text>

  <!-- Divider line under wordmark -->
  <rect x="${cx - 70}" y="365" width="140" height="2" fill="#7B3AEC" opacity="0.8"/>

  <!-- Product subtitle -->
  <text x="${cx}" y="405" text-anchor="middle"
        font-family="'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
        font-size="22" font-weight="400"
        fill="#ffffff" opacity="0.85">AI Governance Kit</text>

  <!-- Tier pill -->
  <rect x="${cx - 95}" y="440" width="190" height="46" rx="23"
        fill="none" stroke="#7B3AEC" stroke-width="2"/>
  <text x="${cx}" y="470" text-anchor="middle"
        font-family="'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
        font-size="16" font-weight="600" letter-spacing="4"
        fill="#7B3AEC">ENTERPRISE</text>

  <!-- Price -->
  <text x="${cx}" y="535" text-anchor="middle"
        font-family="'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
        font-size="30" font-weight="300"
        fill="#ffffff" opacity="0.7">$34.99</text>

  <!-- Footer -->
  <text x="${cx}" y="578" text-anchor="middle"
        font-family="'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
        font-size="11" font-weight="400" letter-spacing="2"
        fill="#ffffff" opacity="0.3">AEGIS INITIATIVE  |  aegis-initiative.com</text>
</svg>`;
}

async function main() {
  // Landscape: rasterize the source SVG as-is.
  const landscapeBuf = fs.readFileSync(SRC_SVG);
  await sharp(landscapeBuf).png().toFile(path.join(OUT_DIR, 'cover-aegis-enterprise.png'));
  console.log('Wrote cover-aegis-enterprise.png (1600x900 from source SVG)');

  // Thumb: custom 600x600 layout reusing the same visual elements.
  await sharp(Buffer.from(thumbSvg())).png().toFile(path.join(OUT_DIR, 'thumb-aegis-enterprise.png'));
  console.log('Wrote thumb-aegis-enterprise.png (600x600 custom layout)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
