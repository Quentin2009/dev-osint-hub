// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server', // ou 'hybrid'
  adapter: vercel(),
  // ... le reste de ta config existante
  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel()
});