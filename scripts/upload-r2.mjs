#!/usr/bin/env node
/**
 * Bulk-upload digital book files (PDF + EPUB) from output/digital/<slug>/
 * to the finnoybu-press-pdfs R2 bucket.
 *
 * Auth: relies on CLOUDFLARE_API_TOKEN env var (or `wrangler login` session).
 *
 * Usage:
 *   npm run r2:sync
 *
 * Re-runs are safe — wrangler overwrites the same object key on each put.
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIGITAL_DIR = 'output/digital';
const BUCKET = 'finnoybu-press-pdfs';
const FORMATS = ['pdf', 'epub'];

if (!existsSync(DIGITAL_DIR)) {
  console.error(`Directory not found: ${DIGITAL_DIR}`);
  process.exit(1);
}

const slugs = readdirSync(DIGITAL_DIR).filter((name) =>
  statSync(join(DIGITAL_DIR, name)).isDirectory(),
);

let uploaded = 0;
let skipped = 0;
let failed = 0;

for (const slug of slugs) {
  for (const ext of FORMATS) {
    const filePath = join(DIGITAL_DIR, slug, `${slug}.${ext}`);
    if (!existsSync(filePath)) {
      console.log(`SKIP  ${slug}.${ext} (not found)`);
      skipped++;
      continue;
    }
    const key = `${slug}/${slug}.${ext}`;
    try {
      console.log(`PUT   ${key}`);
      execSync(
        `npx wrangler r2 object put "${BUCKET}/${key}" --file="${filePath}"`,
        { stdio: 'inherit' },
      );
      uploaded++;
    } catch (err) {
      console.error(`FAIL  ${key}: ${err.message}`);
      failed++;
    }
  }
}

console.log(`\nDone: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
