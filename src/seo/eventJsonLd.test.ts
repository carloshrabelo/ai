import { describe, expect, it } from 'vitest'
import type { DanceEvent } from '../domain/event'
import { eventJsonLd, eventListJsonLd, parsePrice } from './eventJsonLd'

const event: DanceEvent = {
  id: 'a',
  title: 'Festa Mirage',
  genres: ['Kizomba'],
  rawTag: 'Kizomba',
  price: '5€',
  start: new Date('2026-07-03T21:00:00Z'),
  end: new Date('2026-07-04T03:00:00Z'),
  allDay: false,
  venue: { location: 'Mirage', name: 'Mirage Lounge', address: 'R. Heróis de Chaimite 31, Odivelas', lat: 38.79, lng: -9.18 },
  description: 'Mais info:<br>@mirage &amp; amigos',
  links: [],
  calendarUrl: '',
}

describe('eventJsonLd', () => {
  it('evento com hora, local com coordenadas e preço simples', () => {
    expect(eventJsonLd(event, 'https://x/?event=a')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'DanceEvent',
      name: 'Festa Mirage',
      startDate: '2026-07-03T21:00:00.000Z',
      endDate: '2026-07-04T03:00:00.000Z',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      url: 'https://x/?event=a',
      description: 'Mais info:\n@mirage & amigos',
      keywords: 'Kizomba',
      location: {
        '@type': 'Place',
        name: 'Mirage Lounge',
        address: 'R. Heróis de Chaimite 31, Odivelas',
        geo: { '@type': 'GeoCoordinates', latitude: 38.79, longitude: -9.18 },
      },
      offers: { '@type': 'Offer', price: 5, priceCurrency: 'EUR', url: 'https://x/?event=a' },
    })
  })

  it('cancelado e dia inteiro', () => {
    const ld = eventJsonLd(
      { ...event, status: 'cancelled', allDay: true, start: new Date('2026-07-29T23:00:00Z'), end: new Date('2026-08-02T23:00:00Z') },
      'u',
    )
    expect(ld).toMatchObject({ eventStatus: 'https://schema.org/EventCancelled', startDate: '2026-07-30', endDate: '2026-08-03' })
  })

  it('lista com posições', () => {
    const list = eventListJsonLd([event, { ...event, id: 'b' }], (e) => `u/${e.id}`)
    expect(list).toMatchObject({ '@type': 'ItemList', itemListElement: [{ position: 1 }, { position: 2 }] })
  })
})

describe('parsePrice', () => {
  it.each([
    ['5€', 5],
    ['10 €', 10],
    ['7,50€', 7.5],
    ['5€ ou 7€', undefined],
    ['Pago', undefined],
    [undefined, undefined],
  ])('%j → %j', (text, expected) => {
    expect(parsePrice(text)).toBe(expected)
  })
})
