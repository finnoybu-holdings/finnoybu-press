import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://press.finnoybu.org',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  image: {
    // Built-in image optimization for thumbnails / responsive covers.
  },
});
