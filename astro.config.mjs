import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// Press runs on Cloudflare Pages. The cloudflare adapter wires
// Astro.locals.runtime.env so route handlers can access D1, R2, and
// other bindings declared in wrangler.toml. SSR is "server" output;
// content collections still prerender at build time.
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
