// Gera as páginas estáticas depois do `vite build` (SEO sem servidor: GitHub Pages):
//   dist/event/<slug>/index.html  — uma por evento (de ontem a 90 dias à frente: o período do cache)
//   dist/index.html                — agenda com a lista dos próximos eventos
//   dist/404.html                  — fallback de SPA (cópia do index.html original)
//   dist/sitemap.xml               — rotas fixas + eventos futuros
//   dist/evento/<slug>/, mapa/…    — redirecionam das rotas antigas (em português) para as novas
//   dist/events-cache.json         — cache dos eventos (o app o usa quando a Google Calendar API falha)
// Com o mock (VITE_USE_MOCK), os eventos vêm dele; com a API, do cache (scripts/lib/eventsCache.ts:
// gerado de novo se tiver mais de 6 horas, com o publicado no site como base se a API falhar). Sem
// nenhum, o build segue só com as páginas fixas.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { root, startApp } from './lib/app.ts'
import { CACHE_PATH, loadCachedEvents, readCache } from './lib/eventsCache.ts'
import type { DatesModule, IsoDate, ScriptEvent } from './lib/types.ts'

type PrerenderModule = {
  legacyEventPagePath: (event: ScriptEvent) => string
  renderRedirectPage: (url: string) => string
  loadEvents: (from: IsoDate, to: IsoDate) => Promise<ScriptEvent[]>
  renderEventPage: (template: string, event: ScriptEvent, siteUrl: string) => string
  renderHomePage: (template: string, events: ScriptEvent[], siteUrl: string) => string
  renderSitemap: (siteUrl: string, routes: readonly string[], events: ScriptEvent[], today: IsoDate) => string
}

const outDir = join(root, 'dist')
const siteUrl = process.env.SITE_URL ?? (process.env.GITHUB_PAGES ? 'https://lisbondance.com/' : 'http://localhost:4173/')
const PUBLIC_ROUTES = ['', 'map/', 'community/', 'about/']
// Rotas antigas, em português → novas: páginas que só redirecionam (links já compartilhados).
const LEGACY_ROUTES: Record<string, string> = { 'mapa/': 'map/', 'comunidade/': 'community/', 'info/': 'about/', 'escolas/': 'schools/' }
// Eventos de ontem ainda têm página (a madrugada); o sitemap só tem os futuros. Link de evento mais
// antigo abre pelo app (busca o dia na API), sem a página estática.
const DAYS_BEFORE = 1
const DAYS_AFTER = 90

// A chave da API é restrita por referer (o site): a mesma origem do app.
const app = await startApp({ name: 'prerender', referer: siteUrl })
try {
  const { legacyEventPagePath, loadEvents, renderEventPage, renderHomePage, renderRedirectPage, renderSitemap } =
    await app.load<PrerenderModule>('/src/seo/prerender.ts')
  const { addDays, todayIso } = await app.load<DatesModule>('/src/lib/dates.ts')
  const { USE_MOCK, WINDOW_DAYS } = await app.load<{ USE_MOCK: boolean; WINDOW_DAYS: number }>('/src/api/config.ts')
  const { agendaToday, lisbonMidnight } = await app.load<DatesModule & { agendaToday: () => IsoDate }>('/src/lib/dates.ts')
  const { itemsInWindow } = await app.load<{ itemsInWindow: (items: unknown[], timeMin: Date, timeMax: Date) => unknown[] }>(
    '/src/api/eventsCache.ts',
  )
  const { initialEventsScript } = await app.load<{ initialEventsScript: (data: unknown) => string }>('/src/api/initialEvents.ts')

  const template = readFileSync(join(outDir, 'index.html'), 'utf8')
  writeFileSync(join(outDir, '404.html'), template)

  const today = todayIso()
  let events: ScriptEvent[] = []
  try {
    const [from, to] = [addDays(today, -DAYS_BEFORE), addDays(today, DAYS_AFTER)]
    if (USE_MOCK) events = await loadEvents(from, to)
    else {
      events = await loadCachedEvents(app, from, to)
      copyFileSync(CACHE_PATH, join(outDir, 'events-cache.json'))
    }
  } catch (error) {
    console.warn(`prerender: eventos indisponíveis (${error instanceof Error ? error.message : String(error)}); só páginas fixas.`)
  }

  const writePage = (path: string, html: string) => {
    mkdirSync(join(outDir, path), { recursive: true })
    writeFileSync(join(outDir, path, 'index.html'), html)
  }
  for (const event of events) {
    writePage(`event/${event.slug}`, renderEventPage(template, event, siteUrl))
    writePage(legacyEventPagePath(event), renderRedirectPage(`${siteUrl}event/${event.slug}/`))
  }
  for (const [from, to] of Object.entries(LEGACY_ROUTES)) writePage(from, renderRedirectPage(`${siteUrl}${to}`))

  const upcoming = events.filter((event) => event.end.getTime() > Date.now())
  let home = renderHomePage(template, upcoming, siteUrl)
  // Primeira janela da agenda no HTML (src/api/initialEvents.ts): os cards aparecem sem esperar a API.
  const cache = USE_MOCK ? undefined : readCache()
  if (cache) {
    const start = agendaToday()
    const end = addDays(start, WINDOW_DAYS)
    const items = itemsInWindow(cache.items, lisbonMidnight(start), lisbonMidnight(end))
    home = home.replace('</head>', `${initialEventsScript({ generatedAt: cache.generatedAt, page: { start, end, items } })}\n</head>`)
    console.log(`prerender: ${items.length} eventos da primeira janela (${start} a ${end}) no index.html.`)
  }
  writeFileSync(join(outDir, 'index.html'), home)
  writeFileSync(join(outDir, 'sitemap.xml'), renderSitemap(siteUrl, PUBLIC_ROUTES, upcoming, today))

  console.log(`prerender: ${events.length} páginas de evento, ${upcoming.length} no sitemap.`)
} finally {
  await app.close()
}
