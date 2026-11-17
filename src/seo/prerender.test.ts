import { describe, expect, it } from 'vitest'
import type { DanceEvent } from '../domain/event'
import { slugFromPath } from '../features/events/useSelectedEvent'
import { renderEventPage, renderHomePage, renderSitemap } from './prerender'

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
}

describe('slugFromPath', () => {
  it('lê o slug de /evento/<slug>/ (com ou sem barra final)', () => {
    expect(slugFromPath('/evento/2026-11-17-samba-x1y2z/')).toBe('2026-11-17-samba-x1y2z')
    expect(slugFromPath('/evento/2026-11-17-samba-x1y2z')).toBe('2026-11-17-samba-x1y2z')
    expect(slugFromPath('/')).toBeNull()
    expect(slugFromPath('/evento/')).toBeNull()
  })
})

describe('renderEventPage', () => {
  const html = renderEventPage(template, event, site)
  const url = `${site}evento/${event.slug}/`

  it('head próprio: título, canonical, og:url e JSON-LD', () => {
    expect(html).toContain('<title>Samba &lt;no&gt; Mercado · Terça-feira, 17/11 — Lisbon Social Dance</title>')
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
    expect(renderHomePage(template, [event], site)).toContain(`<a href="${site}evento/${event.slug}/">`)
  })

  it('sitemap com rotas fixas e eventos', () => {
    const xml = renderSitemap(site, ['', 'info/'], [event], '2026-11-17')
    expect(xml).toContain(`<loc>${site}info/</loc>`)
    expect(xml).toContain(`<loc>${site}evento/${event.slug}/</loc>`)
  })
})
