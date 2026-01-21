import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://nantyara.com',
  base: '/',
  build: {
    assets: '_astro',
  },
  server: {
    port: 3000,
  },
});
