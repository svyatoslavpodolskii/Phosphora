import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  base: '/phosphored/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Phosphored — живая карта',
        short_name: 'Phosphored',
        lang: 'ru',
        start_url: '.',
        display: 'standalone',
        background_color: '#101b1a',
        theme_color: '#101b1a',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,wasm}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],

  worker: {
    format: 'es',
  },

  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },

  server: {
    port: 5173,
    strictPort: true,
    headers: isolationHeaders,
  },

  preview: {
    port: 4173,
    strictPort: true,
    headers: isolationHeaders,
  },
});
