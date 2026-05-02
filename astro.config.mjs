import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://press.finnoybu.org',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  integrations: [sitemap()],
  image: {
    // Built-in image optimization for thumbnails / responsive covers.
  },
});
