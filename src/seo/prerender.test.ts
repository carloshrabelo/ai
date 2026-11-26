import { describe, expect, it } from 'vitest'
import type { DanceEvent } from '../domain/event'
import { slugFromPath } from '../features/events/useSelectedEvent'
import { renderEventPage, renderHomePage, renderRedirectPage, renderSitemap } from './prerender'

const site = 'https://example.com/ai/'
const template = `<html><head>
<title>Agenda</title>
<meta name="description" content="padrão" />
<link rel="canonical" href="${site}" />
<meta property="og:url" content="${site}" />
</head><body><div id="root"></div></body></html>`

const event: DanceEvent = {
  id: 'abc',
  slug: '2026-11-17-samba-no-mercado-x1y2z',
  title: 'Samba <no> Mercado',
  genres: ['Samba'],
  rawTag: 'Samba',
  start: new Date('2026-11-17T20:00:00Z'),
  end: new Date('2026-11-17T23:45:00Z'),
  allDay: false,
  venue: { location: 'Time Out', name: 'Time Out Market', address: 'Av. 24 de Julho 49' },
  description: 'Linha 1<br>Linha 2<br><br>Outro parágrafo',
  links: [],
  calendarUrl: '',
  source: 'pasdedeux',
}

describe('slugFromPath', () => {
  it('lê o slug de /event/<slug>/ (com ou sem barra final)', () => {
    expect(slugFromPath('/event/2026-11-17-samba-x1y2z/')).toBe('2026-11-17-samba-x1y2z')
    expect(slugFromPath('/event/2026-11-17-samba-x1y2z')).toBe('2026-11-17-samba-x1y2z')
    expect(slugFromPath('/')).toBeNull()
    expect(slugFromPath('/event/')).toBeNull()
  })
})

describe('renderRedirectPage', () => {
  it('redireciona da rota antiga para a nova, mantendo a busca', () => {
    const html = renderRedirectPage(`${site}event/abc/`)
    expect(html).toContain(`<link rel="canonical" href="${site}event/abc/">`)
    expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${site}event/abc/">`)
    expect(html).toContain(`location.replace("${site}event/abc/" + location.search + location.hash)`)
  })
})

describe('renderEventPage', () => {
  const html = renderEventPage(template, event, site)
  const url = `${site}event/${event.slug}/`

  it('head próprio: título, canonical, og:url e JSON-LD', () => {
    expect(html).toContain('<title>Samba &lt;no&gt; Mercado · Terça-feira, 17/11 — Lisbon Dance</title>')
    expect(html).toContain(`<link rel="canonical" href="${url}" />`)
    expect(html).toContain(`<meta property="og:url" content="${url}" />`)
    expect(html).toContain('"@type":"DanceEvent"')
    expect(html).not.toContain('content="padrão"')
  })

  it('conteúdo do evento no #root, com HTML escapado', () => {
    expect(html).toContain('<h1 class="text-2xl font-semibold">Samba &lt;no&gt; Mercado</h1>')
    expect(html).toContain('<p>Linha 1<br>Linha 2</p><p>Outro parágrafo</p>')
    expect(html).toContain('<address>Time Out Market, Av. 24 de Julho 49</address>')
  })
})

describe('renderHomePage / renderSitemap', () => {
  it('agenda com links para as páginas dos eventos', () => {
    expect(renderHomePage(template, [event], site)).toContain(`<a href="${site}event/${event.slug}/">`)
  })

  it('sitemap com rotas fixas e eventos', () => {
    const xml = renderSitemap(site, ['', 'about/'], [event], '2026-11-17')
    expect(xml).toContain(`<loc>${site}about/</loc>`)
    expect(xml).toContain(`<loc>${site}event/${event.slug}/</loc>`)
  })

  it('lastmod do evento: a última alteração no calendário (sem ela, o dia do build)', () => {
    const changed = { ...event, updated: new Date('2026-11-10T23:30:00Z') } // 10/11 23:30 UTC = 10/11 em Lisboa
    const xml = renderSitemap(site, [''], [changed, { ...event, slug: 'outro' }], '2026-11-17')
    expect(xml).toContain(`<loc>${site}event/${event.slug}/</loc><lastmod>2026-11-10</lastmod>`)
    expect(xml).toContain(`<loc>${site}event/outro/</loc><lastmod>2026-11-17</lastmod>`)
    expect(xml).toContain(`<loc>${site}</loc><lastmod>2026-11-17</lastmod>`)
  })
})
