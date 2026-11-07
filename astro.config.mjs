// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ciscorustdeerplant.com',
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  vite: { plugins: [tailwindcss()] },
  image: { layout: 'constrained' },
  fonts: [
    {
      provider: fontProviders.npm(),
      name: 'Anton',
      cssVariable: '--font-anton',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Impact', 'Arial Narrow', 'sans-serif'],
    },
    {
      provider: fontProviders.npm(),
      name: 'Barlow',
      cssVariable: '--font-barlow',
      weights: [400, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'Arial', 'sans-serif'],
    },
    {
      provider: fontProviders.npm(),
      name: 'Barlow Condensed',
      cssVariable: '--font-barlow-condensed',
      weights: [600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Arial Narrow', 'sans-serif'],
    },
    {
      provider: fontProviders.npm(),
      name: 'Kaushan Script',
      cssVariable: '--font-kaushan',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['cursive'],
    },
  ],
});
