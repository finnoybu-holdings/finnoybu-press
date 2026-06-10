import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// Press runs on Cloudflare WORKERS (migrated from Pages 2026-06; adapter v13 is
// Workers-only). The cloudflare adapter builds to dist/client + dist/server and
// generates dist/server/wrangler.json (the deploy config). Route handlers read
// D1 / R2 / other bindings via `import { env } from 'cloudflare:workers'`
// (see src/lib/env.ts). SSR "server" output; content collections still
// prerender at build time. imageService 'compile' keeps build-time image
// optimization (no runtime IMAGES binding needed).
export default defineConfig({
  site: 'https://press.finnoybu.org',
  trailingSlash: 'never',
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
  }),
  build: {
    format: 'directory',
  },
  integrations: [sitemap()],
});
