import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://press.finnoybu.org',
  trailingSlash: 'never',
  output: 'server',
  adapter: vercel({
    // includeFiles: bundle digital book files into the serverless function
    // so /api/download can stream them. Add explicit paths once digital
    // files exist (see docs/COMMERCE_SETUP.md). Empty for now since the
    // adapter's path resolution doesn't tolerate non-existent globs.
    // Example once book 11 is built:
    //   includeFiles: [
    //     './output/digital/notebooklm/notebooklm.pdf',
    //     './output/digital/notebooklm/notebooklm.epub',
    //   ],
  }),
  build: {
    format: 'directory',
  },
  integrations: [sitemap()],
  image: {
    // Built-in image optimization for thumbnails / responsive covers.
  },
});
