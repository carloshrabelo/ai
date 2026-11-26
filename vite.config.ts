/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Na raiz do domínio próprio (lisbondance.com) e em dev.
const base = '/'

// Service worker no `pnpm dev` só quando pedido (PWA_DEV=true pnpm dev): em dev ele serve cache velho.
const pwaInDev = process.env.PWA_DEV === 'true'

// URL pública, para canonical, Open Graph e sitemap (precisam ser absolutas).
const siteUrl = process.env.SITE_URL ?? (process.env.GITHUB_PAGES ? 'https://lisbondance.com/' : 'http://localhost:4173/')

/** Rotas públicas fixas (agenda, mapa, comunidade e Sobre). Escolas está oculta e fica de fora. */
const PUBLIC_ROUTES = ['', 'map/', 'community/', 'about/']

/**
 * SEO estático (lido por buscadores e redes sociais sem executar JavaScript):
 * - troca %SITE_URL% no index.html (canonical, og:url, og:image);
 * - gera sitemap.xml e robots.txt;
 * - copia o index.html para cada rota (about/index.html): no GitHub Pages, sem essa cópia,
 *   /about cai no 404.html e responde HTTP 404, embora a página funcione.
 */
function seoFiles(): Plugin {
  let outDir = 'dist'
  return {
    name: 'seo-files',
    configResolved(config) {
      outDir = config.build.outDir
    },
    transformIndexHtml(html) {
      return html.replaceAll('%SITE_URL%', siteUrl)
    },
    closeBundle() {
      // Sitemap só com as rotas fixas; o scripts/prerender.mjs o reescreve com as páginas dos eventos.
      const today = new Date().toISOString().slice(0, 10)
      const urls = PUBLIC_ROUTES.map(
        (route) => `  <url><loc>${siteUrl}${route}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq></url>`,
      )
      writeFileSync(
        join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
      )
      writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`)
      for (const route of PUBLIC_ROUTES.filter(Boolean)) {
        mkdirSync(join(outDir, route), { recursive: true })
        copyFileSync(join(outDir, 'index.html'), join(outDir, route, 'index.html'))
      }
    },
  }
}

// Análise do bundle (`pnpm analyze`): gera bundle-stats.html na raiz (fora do dist/, para não ir para o
// deploy nem para o precache do service worker). Ver "Analisar o bundle" no README.
const analyze = process.env.ANALYZE === 'true'

// Versão exibida na página Info, para saber qual build está carregado.
const appVersion = (process.env.GITHUB_SHA ?? '').slice(0, 7) || 'local'

// https://vite.dev/config/
export default defineConfig({
  base,
  // Vitest: os testes de ponta a ponta (e2e/) são do Playwright (`pnpm e2e`).
  test: { exclude: ['**/node_modules/**', 'e2e/**'] },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __PWA_IN_DEV__: JSON.stringify(pwaInDev),
  },
  plugins: [
    seoFiles(),
    react(),
    tailwindcss(),
    VitePWA({
      // Versão nova assume na hora (sem esperar o usuário clicar em "Atualizar").
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Lisbon Dance with Pas de Deux',
        short_name: 'Lisbon Dance',
        description: 'Agenda de práticas, festas e eventos de dança social em Lisboa',
        lang: 'pt-BR',
        // Mesmas cores do header e do fundo no tema claro (index.css; THEME_COLOR em src/theme/useTheme.ts).
        theme_color: '#ffffff',
        background_color: '#f7f7f7',
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
    analyze &&
      visualizer({
        filename: 'bundle-stats.html',
        title: 'Lisbon Dance — bundle',
        template: (process.env.ANALYZE_TEMPLATE as 'treemap' | 'sunburst' | 'network' | 'flamegraph' | undefined) ?? 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: !process.env.CI,
      }),
  ],
})
