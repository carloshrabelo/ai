// Gera as páginas estáticas depois do `vite build` (SEO sem servidor: GitHub Pages):
//   dist/evento/<slug>/index.html  — uma por evento (de 1 semana atrás a 90 dias à frente)
//   dist/index.html                — agenda com a lista dos próximos eventos
//   dist/404.html                  — fallback de SPA (cópia do index.html original)
//   dist/sitemap.xml               — rotas fixas + eventos futuros
// Os dados vêm da mesma fonte do app (mock ou API, conforme VITE_USE_MOCK). Se a API falhar, o
// build segue só com as páginas fixas.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'dist')
const siteUrl = process.env.SITE_URL ?? (process.env.GITHUB_PAGES ? 'https://carloshrabelo.github.io/ai/' : 'http://localhost:4173/')
const PUBLIC_ROUTES = ['', 'mapa/', 'info/']
const DAYS_BEFORE = 7
const DAYS_AFTER = 90

// A chave da API é restrita por referer (o site): a mesma origem do app.
const originalFetch = globalThis.fetch
globalThis.fetch = (input, init = {}) => {
  const url = String(input instanceof Request ? input.url : input)
  if (!url.startsWith('https://www.googleapis.com/')) return originalFetch(input, init)
  const headers = new Headers(init.headers)
  headers.set('Referer', siteUrl)
  return originalFetch(input, { ...init, headers })
}

const vite = await createServer({
  root,
  configFile: false,
  logLevel: 'warn',
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, ws: false },
  define: { __APP_VERSION__: '"prerender"', __APP_BUILD_TIME__: '""', __PWA_IN_DEV__: 'false' },
})

try {
  const { loadEvents, renderEventPage, renderHomePage, renderSitemap } = await vite.ssrLoadModule('/src/seo/prerender.ts')
  const { addDays, todayIso } = await vite.ssrLoadModule('/src/data/dates.ts')

  const template = readFileSync(join(outDir, 'index.html'), 'utf8')
  writeFileSync(join(outDir, '404.html'), template)

  const today = todayIso()
  let events = []
  try {
    events = await loadEvents(addDays(today, -DAYS_BEFORE), addDays(today, DAYS_AFTER))
  } catch (error) {
    console.warn(`prerender: eventos indisponíveis (${error.message}); só páginas fixas.`)
  }

  for (const event of events) {
    const dir = join(outDir, 'evento', event.slug)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), renderEventPage(template, event, siteUrl))
  }

  const upcoming = events.filter((event) => event.end.getTime() > Date.now())
  writeFileSync(join(outDir, 'index.html'), renderHomePage(template, upcoming, siteUrl))
  writeFileSync(join(outDir, 'sitemap.xml'), renderSitemap(siteUrl, PUBLIC_ROUTES, upcoming, today))

  console.log(`prerender: ${events.length} páginas de evento, ${upcoming.length} no sitemap.`)
} finally {
  await vite.close()
}
