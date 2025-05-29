// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import alpinejs from '@astrojs/alpinejs';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Enable SSR for real-time data fetching
  output: 'server',
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    alpinejs(),
  ],
});
