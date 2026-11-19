import { describe, expect, it } from 'vitest'
import type { DanceEvent } from './event'
import { collectPromoters, mergePromoters, type PromoterEntry, similarHandles, socialOf } from './promoterDirectory'

const venue = (name: string) => ({ name, location: name, address: '' })

const event = (over: Partial<DanceEvent>): DanceEvent => ({
  id: 'x',
  slug: 'x',
  title: 'Noite',
  genres: [],
  rawTag: '',
  start: new Date('2026-11-20T20:00:00Z'),
  end: new Date('2026-11-20T23:00:00Z'),
  allDay: false,
  links: [],
  calendarUrl: '',
  ...over,
})

describe('socialOf', () => {
  it.each([
    ['https://www.facebook.com/espacobaiao/', 'facebook', 'https://facebook.com/espacobaiao'],
    ['https://www.tiktok.com/@dalebachata?lang=pt', 'tiktok', 'https://tiktok.com/@dalebachata'],
    ['https://youtube.com/@forrovinyl', 'youtube', 'https://youtube.com/@forrovinyl'],
    ['https://linktr.ee/tropicavana', 'linktree', 'https://linktr.ee/tropicavana'],
    ['https://chat.whatsapp.com/AbC123', 'whatsapp', 'https://chat.whatsapp.com/AbC123'],
    ['https://www.espacobaiao.pt/', 'website', 'https://espacobaiao.pt'],
    ['https://bluesswinglisboa.com/eventos/x', 'website', 'https://bluesswinglisboa.com'],
    ['https://youtube.com/channel/UC123', 'youtube', 'https://youtube.com/channel/UC123'],
  ])('%s', (url, kind, clean) => {
    expect(socialOf(url)).toEqual({ kind, url: clean })
  })

  it.each([
    'https://www.facebook.com/events/123/',
    'https://www.instagram.com/espacobaiao/',
    'https://maps.app.goo.gl/abc',
    'https://www.eventbrite.pt/',
    'https://www.youtube.com/watch?v=1',
    'https://shotgun.live/pt-pt/events/x',
    'https://www.facebook.com/share/abc',
    'https://thelastseat.com/kmfas',
    'https://buytickets.at/dansunday/123',
    'https://3cket.com/event/x',
    'nao é url',
  ])('não é perfil: %s', (url) => {
    expect(socialOf(url)).toBeUndefined()
  })
})

describe('collectPromoters', () => {
  const day = (e: DanceEvent) => e.start.toISOString().slice(0, 10)

  it('junta locais, estilos e redes por perfil', () => {
    const found = collectPromoters(
      [
        event({
          description: 'Mais info: @espacobaiao',
          venue: venue('Teatro A Barraca'),
          genres: ['Forró'],
          links: ['https://facebook.com/espacobaiao'],
        }),
        event({
          description: 'Mais info: @espacobaiao',
          venue: venue('Teatro A Barraca'),
          genres: ['Forró'],
          start: new Date('2026-12-01T20:00:00Z'),
        }),
        event({
          description: 'Mais info: @espacobaiao @djay.marto',
          venue: venue('Mercado'),
          genres: ['Forró', 'Samba'],
          links: ['https://facebook.com/outro'],
        }),
      ],
      day,
    )
    expect(found.espacobaiao).toEqual({
      role: 'promoter',
      socials: { instagram: 'https://www.instagram.com/espacobaiao/', facebook: 'https://facebook.com/espacobaiao' },
      venues: ['Teatro A Barraca', 'Mercado'],
      genres: ['Forró', 'Samba'],
      lastSeen: '2026-12-01',
    })
    // Link de evento com dois promotores não é atribuído a ninguém.
    expect(found['djay.marto'].socials.facebook).toBeUndefined()
  })
})

describe('mergePromoters', () => {
  const entry = (over: Partial<PromoterEntry> = {}): PromoterEntry => ({
    role: 'promoter',
    socials: {},
    venues: [],
    genres: [],
    lastSeen: '2026-01-01',
    ...over,
  })

  it('mantém o que estava (nome, foto, papel, redes), acrescenta o novo e avança lastSeen', () => {
    const merged = mergePromoters(
      {
        zeta: entry({ venues: ['A'] }),
        baiao: entry({
          name: 'Espaço Baião',
          photo: 'promoters/baiao.webp',
          role: 'teacher',
          socials: { facebook: 'https://facebook.com/manual' },
          venues: ['A'],
          genres: ['Forró'],
          lastSeen: '2026-10-01',
        }),
      },
      {
        baiao: entry({
          socials: { instagram: 'https://www.instagram.com/baiao/', facebook: 'https://facebook.com/auto' },
          venues: ['B', 'A'],
          genres: ['Samba'],
          lastSeen: '2026-11-01',
        }),
      },
    )
    expect(Object.keys(merged)).toEqual(['baiao', 'zeta'])
    expect(merged.baiao).toEqual({
      name: 'Espaço Baião',
      photo: 'promoters/baiao.webp',
      role: 'teacher',
      socials: { instagram: 'https://www.instagram.com/baiao/', facebook: 'https://facebook.com/manual' },
      venues: ['A', 'B'],
      genres: ['Forró', 'Samba'],
      lastSeen: '2026-11-01',
    })
  })

  it('incorpora os aliases ao perfil certo (do arquivo e do que foi encontrado)', () => {
    const merged = mergePromoters(
      {
        'dale.events': entry({ aliases: ['dale.eventss'], venues: ['A'] }),
        'dale.eventss': entry({ venues: ['B'], lastSeen: '2026-05-01' }),
      },
      {
        'dale.eventss': entry({ socials: { instagram: 'https://www.instagram.com/dale.eventss/' }, venues: ['C'], lastSeen: '2026-12-01' }),
      },
    )
    expect(Object.keys(merged)).toEqual(['dale.events'])
    expect(merged['dale.events']).toMatchObject({
      aliases: ['dale.eventss'],
      socials: { instagram: 'https://www.instagram.com/dale.events/' },
      venues: ['A', 'B', 'C'],
      lastSeen: '2026-12-01',
    })
  })
})

describe('collectPromoters: papel', () => {
  it('promotor se veio em "Mais info"; senão o papel mais comum', () => {
    const day = () => '2026-11-20'
    const found = collectPromoters(
      [
        event({ description: 'DJ @x.som<br>Mais info: @casa' }),
        event({ description: 'DJ @x.som e aula com @prof' }),
        event({ description: 'Mais info: @x.som' }),
      ],
      day,
    )
    expect(found['x.som'].role).toBe('promoter')
    expect(found.casa.role).toBe('promoter')
  })
})

describe('similarHandles', () => {
  it('acha grafias parecidas', () => {
    expect(
      similarHandles([
        'dale.events',
        'dale.eventss',
        'tropicavana.bar',
        'tropicavana_bar',
        'dansundayoficial',
        'dancesundayoficial',
        'dalesalsa.pt',
        'dalebachata.pt',
      ]),
    ).toEqual([
      ['dale.events', 'dale.eventss'],
      ['dancesundayoficial', 'dansundayoficial'],
      ['tropicavana.bar', 'tropicavana_bar'],
    ])
  })
})
