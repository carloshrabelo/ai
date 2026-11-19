// Gera as páginas estáticas depois do `vite build` (SEO sem servidor: GitHub Pages):
//   dist/evento/<slug>/index.html  — uma por evento (de 1 semana atrás a 90 dias à frente)
//   dist/index.html                — agenda com a lista dos próximos eventos
//   dist/404.html                  — fallback de SPA (cópia do index.html original)
//   dist/sitemap.xml               — rotas fixas + eventos futuros
// Os dados vêm da mesma fonte do app (mock ou API, conforme VITE_USE_MOCK). Se a API falhar, o
// build segue só com as páginas fixas.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { root, startApp } from './lib/app.ts'
import type { DatesModule, IsoDate, ScriptEvent } from './lib/types.ts'

type PrerenderModule = {
  loadEvents: (from: IsoDate, to: IsoDate) => Promise<ScriptEvent[]>
  renderEventPage: (template: string, event: ScriptEvent, siteUrl: string) => string
  renderHomePage: (template: string, events: ScriptEvent[], siteUrl: string) => string
  renderSitemap: (siteUrl: string, routes: readonly string[], events: ScriptEvent[], today: IsoDate) => string
}

const outDir = join(root, 'dist')
const siteUrl = process.env.SITE_URL ?? (process.env.GITHUB_PAGES ? 'https://carloshrabelo.github.io/ai/' : 'http://localhost:4173/')
const PUBLIC_ROUTES = ['', 'mapa/', 'comunidade/', 'info/']
const DAYS_BEFORE = 7
const DAYS_AFTER = 90

// A chave da API é restrita por referer (o site): a mesma origem do app.
const app = await startApp({ name: 'prerender', referer: siteUrl })
try {
  const { loadEvents, renderEventPage, renderHomePage, renderSitemap } = await app.load<PrerenderModule>('/src/seo/prerender.ts')
  const { addDays, todayIso } = await app.load<DatesModule>('/src/lib/dates.ts')

  const template = readFileSync(join(outDir, 'index.html'), 'utf8')
  writeFileSync(join(outDir, '404.html'), template)

  const today = todayIso()
  let events: ScriptEvent[] = []
  try {
    events = await loadEvents(addDays(today, -DAYS_BEFORE), addDays(today, DAYS_AFTER))
  } catch (error) {
    console.warn(`prerender: eventos indisponíveis (${error instanceof Error ? error.message : String(error)}); só páginas fixas.`)
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
  await app.close()
}
