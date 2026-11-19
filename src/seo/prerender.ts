// Páginas estáticas geradas no build (scripts/prerender.mjs), lidas por buscadores e redes sociais
// sem executar JavaScript. Ao abrir no navegador, o React substitui o conteúdo de #root pelo app.
// Roda no Node (via Vite ssrLoadModule): nada de window/document aqui.

import { type IsoDate, lisbonDate } from '../data/dates'
import type { DanceEvent } from '../domain/event'
import { visibleGenres } from '../domain/genres'
import { formatDayHeading, formatTimeRange } from '../features/events/format'
import { MESSAGES } from '../i18n/messages'
import { eventJsonLd, eventListJsonLd } from './eventJsonLd'
import { translatePrice } from '../i18n/price'

/** As páginas estáticas saem em pt-BR (o idioma do index.html). */
const LOCALE = 'pt-BR'
const t = MESSAGES[LOCALE]

/** Quantos eventos entram na lista da página inicial. */
const HOME_LIST_SIZE = 40

export { loadEvents } from '../data/loadEvents'

export const eventPagePath = (event: DanceEvent) => `evento/${event.slug}/`

/** Página de um evento: <head> próprio (título, descrição, canonical, Open Graph, JSON-LD) e conteúdo. */
export function renderEventPage(template: string, event: DanceEvent, siteUrl: string): string {
  const url = `${siteUrl}${eventPagePath(event)}`
  const day = formatDayHeading(lisbonDate(event.start), LOCALE)
  const when = `${day}, ${formatTimeRange(event, LOCALE)}`
  const genres = visibleGenres(event.genres).join(', ') || event.rawTag
  const description = [genres, when, event.venue?.name].filter(Boolean).join(' · ')

  const body = `<main class="mx-auto max-w-3xl space-y-4 p-6">
  <p><a href="${siteUrl}">Lisbon Social Dance</a></p>
  <article class="space-y-3">
    <h1 class="text-2xl font-semibold">${escapeHtml(event.title)}</h1>
    <p><time datetime="${event.start.toISOString()}">${escapeHtml(when)}</time></p>
    ${event.status === 'cancelled' ? `<p><strong>${escapeHtml(t.event.cancelled)}</strong></p>` : ''}
    ${genres ? `<p>${escapeHtml(genres)}</p>` : ''}
    ${event.price ? `<p>${escapeHtml(translatePrice(event.price, LOCALE))}</p>` : ''}
    ${event.venue ? `<address>${escapeHtml([event.venue.name, event.venue.address].filter(Boolean).join(', '))}</address>` : ''}
    ${event.description ? `<div>${paragraphs(event.description)}</div>` : ''}
  </article>
</main>`

  return withHead(template, {
    title: t.seo.eventTitle(event.title, day),
    description,
    url,
    jsonLd: eventJsonLd(event, url),
  }).replace('<div id="root"></div>', `<div id="root">${body}</div>`)
}

/** Página inicial: próximos eventos como links (o buscador chega às páginas de cada um). */
export function renderHomePage(template: string, events: readonly DanceEvent[], siteUrl: string): string {
  const upcoming = events.slice(0, HOME_LIST_SIZE)
  const items = upcoming
    .map((event) => {
      const when = `${formatDayHeading(lisbonDate(event.start), LOCALE)}, ${formatTimeRange(event, LOCALE)}`
      return `    <li><a href="${siteUrl}${eventPagePath(event)}">${escapeHtml(event.title)}</a> — <time datetime="${event.start.toISOString()}">${escapeHtml(when)}</time>${event.venue ? ` · ${escapeHtml(event.venue.name)}` : ''}</li>`
    })
    .join('\n')
  const body = `<main class="mx-auto max-w-3xl space-y-4 p-6">
  <h1 class="text-2xl font-semibold">Lisbon Social Dance</h1>
  <p>${escapeHtml(t.seo.homeDescription)}</p>
  <ul class="space-y-1">
${items}
  </ul>
</main>`

  const html =
    upcoming.length > 0
      ? addJsonLd(
          template,
          eventListJsonLd(upcoming, (event) => `${siteUrl}${eventPagePath(event)}`),
        )
      : template
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)
}

/** sitemap.xml com as rotas fixas e as páginas dos eventos. */
export function renderSitemap(siteUrl: string, routes: readonly string[], events: readonly DanceEvent[], today: IsoDate): string {
  const entry = (path: string, changefreq: string) =>
    `  <url><loc>${siteUrl}${path}</loc><lastmod>${today}</lastmod><changefreq>${changefreq}</changefreq></url>`
  const urls = [...routes.map((route) => entry(route, 'daily')), ...events.map((event) => entry(eventPagePath(event), 'weekly'))]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

// ---------------------------------------------------------------------------

type Head = { title: string; description: string; url: string; jsonLd: Record<string, unknown> }

/** Troca as tags do index.html que dependem da página (os valores da agenda vêm como padrão). */
function withHead(template: string, head: Head): string {
  const title = escapeHtml(head.title)
  const description = escapeHtml(head.description)
  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta\s+property="og:type"\s+content=")[^"]*(")/, '$1article$2')
    .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/, `$1${head.url}$2`)
    .replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${head.url}$2`)
    .replace(/(<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href=")[^"]*(")/g, `$1${head.url}$2`)
  return addJsonLd(html, head.jsonLd)
}

function addJsonLd(html: string, data: Record<string, unknown>): string {
  // "</" dentro do JSON fecharia o <script>.
  const json = JSON.stringify(data).replaceAll('</', '<\\/')
  return html.replace('</head>', `    <script type="application/ld+json" id="page-json-ld">${json}</script>\n  </head>`)
}

function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

/** Descrição do calendário (HTML) como texto puro em parágrafos. */
function paragraphs(html: string): string {
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replaceAll('\n', '<br>')}</p>`)
    .join('')
}
