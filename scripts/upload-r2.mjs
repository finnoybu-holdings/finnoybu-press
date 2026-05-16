#!/usr/bin/env node
/**
 * Bulk-upload digital book files (PDF + EPUB) to the finnoybu-press-pdfs R2 bucket.
 *
 * Each book lives in a sibling repo under D:\dev\FINNOYBU Press\NN-<name>\,
 * with its built output in output/<date>-<name>-digital.{pdf,epub}.
 *
 * For each book in src/content/books/*.md:
 *   1. Read `number:` from the frontmatter (1-21).
 *   2. Find sibling repo matching NN-* (zero-padded prefix).
 *   3. Find <repo>/output/*-digital.pdf and *-digital.epub (picks the most recent
 *      if multiple, by mtime).
 *   4. Upload to R2 as <slug>/<slug>.{pdf,epub} where <slug> is the .md filename.
 *
 * Auth: relies on CLOUDFLARE_API_TOKEN env var (or `wrangler login` session).
 *
 * Usage:
 *   npm run r2:sync           # all books
 *   npm run r2:sync chatgpt-definitive   # one slug
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const PRESS_PARENT = join(process.cwd(), '..');
const BOOKS_DIR = 'src/content/books';
const BUCKET = 'finnoybu-press-pdfs';
const FORMATS = ['pdf', 'epub'];

const slugFilter = process.argv[2];

function extractNumber(mdContent) {
  // Normalize CRLF → LF and strip BOM so the regex doesn't choke on Windows endings.
  const normalized = mdContent.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const fm = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const m = fm[1].match(/^number:\s*(\d+)/m);
  return m ? parseInt(m[1], 10) : null;
}

function findSiblingRepo(number) {
  const prefix = String(number).padStart(2, '0') + '-';
  const dirs = readdirSync(PRESS_PARENT).filter((name) => {
    const full = join(PRESS_PARENT, name);
    return statSync(full).isDirectory() && name.startsWith(prefix);
  });
  return dirs[0] ? join(PRESS_PARENT, dirs[0]) : null;
}

function findDigitalFile(repoPath, ext) {
  const outputDir = join(repoPath, 'output');
  if (!existsSync(outputDir)) return null;
  const candidates = readdirSync(outputDir)
    .filter((name) => name.endsWith(`-digital.${ext}`))
    .map((name) => ({ name, path: join(outputDir, name), mtime: statSync(join(outputDir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.path ?? null;
}

if (!existsSync(BOOKS_DIR)) {
  console.error(`Books directory not found: ${BOOKS_DIR}`);
  process.exit(1);
}

const books = readdirSync(BOOKS_DIR)
  .filter((name) => name.endsWith('.md'))
  .map((name) => {
    const slug = basename(name, '.md');
    const content = readFileSync(join(BOOKS_DIR, name), 'utf8');
    const number = extractNumber(content);
    return { slug, number, mdPath: join(BOOKS_DIR, name) };
  })
  .filter((b) => (slugFilter ? b.slug === slugFilter : true));

if (slugFilter && books.length === 0) {
  console.error(`No book found matching slug: ${slugFilter}`);
  process.exit(1);
}

let uploaded = 0;
let skipped = 0;
let failed = 0;

for (const book of books) {
  if (!book.number) {
    console.log(`SKIP  ${book.slug} (no number in frontmatter)`);
    skipped++;
    continue;
  }
  const repo = findSiblingRepo(book.number);
  if (!repo) {
    console.log(`SKIP  ${book.slug} (sibling repo NN=${book.number} not found)`);
    skipped++;
    continue;
  }
  for (const ext of FORMATS) {
    const filePath = findDigitalFile(repo, ext);
    if (!filePath) {
      console.log(`SKIP  ${book.slug}.${ext} (no *-digital.${ext} in ${basename(repo)}/output)`);
      skipped++;
      continue;
    }
    const key = `${book.slug}/${book.slug}.${ext}`;
    try {
      console.log(`PUT   ${key}  ←  ${basename(repo)}/output/${basename(filePath)}`);
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
