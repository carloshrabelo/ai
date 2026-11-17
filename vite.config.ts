import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serve o projeto em https://<user>.github.io/ai/
const base = process.env.GITHUB_PAGES ? '/ai/' : '/'

// Service worker no `pnpm dev` só quando pedido (PWA_DEV=true pnpm dev): em dev ele serve cache velho.
const pwaInDev = process.env.PWA_DEV === 'true'

// Versão exibida na página Info, para saber qual build está carregado.
const appVersion = (process.env.GITHUB_SHA ?? '').slice(0, 7) || 'local'

// https://vite.dev/config/
export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __PWA_IN_DEV__: JSON.stringify(pwaInDev),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Versão nova assume na hora (sem esperar o usuário clicar em "Atualizar").
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Lisbon Social Dance',
        short_name: 'Lisbon Dance',
        description: 'Agenda de práticas, festas e eventos de dança social em Lisboa',
        lang: 'pt-BR',
        theme_color: '#0e7f8f',
        background_color: '#e8f0f2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: `${base}index.html`,
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: pwaInDev,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
})
