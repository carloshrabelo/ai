import { describe, expect, it } from 'vitest'
import type { GCalEvent } from '../data/googleCalendar'
import mock from '../mocks/events.json'
import { extractLinks, toDanceEvent } from './event'

const items = mock.items as GCalEvent[]
const events = items.map(toDanceEvent)

describe('toDanceEvent com o mock', () => {
  it('converte os 37 eventos', () => {
    expect(events).toHaveLength(37)
  })

  it('gêneros de cada summary', () => {
    const result = items.map((item, i) => `${item.summary} → ${events[i].genres.join(', ') || '(nenhum)'}`)
    expect([...new Set(result)].sort()).toMatchSnapshot()
  })

  it('todo location do mock tem coordenadas', () => {
    const withoutCoords = events.filter((e) => e.venue && e.venue.lat === undefined).map((e) => e.venue?.name)
    expect(withoutCoords).toEqual([])
  })

  it('início antes do fim', () => {
    for (const event of events) expect(event.start.getTime()).toBeLessThan(event.end.getTime())
  })
})

describe('toDanceEvent', () => {
  const base: GCalEvent = {
    id: '1',
    status: 'confirmed',
    htmlLink: 'https://calendar.google.com/event?eid=1',
    summary: 'Kizomba • Festa Mirage • Pago',
    start: { dateTime: '2026-07-03T22:00:00+01:00' },
    end: { dateTime: '2026-07-04T04:00:00+01:00' },
    location: 'Mirage Lounge, R. Heróis de Chaimite 31, 2675-376 Odivelas, Portugal',
  }

  it('evento com hora', () => {
    const event = toDanceEvent(base)
    expect(event).toMatchObject({
      title: 'Festa Mirage',
      genres: ['Kizomba'],
      price: 'Pago',
      allDay: false,
      calendarUrl: base.htmlLink,
      venue: { name: 'Mirage Lounge', address: 'R. Heróis de Chaimite 31, 2675-376 Odivelas, Portugal' },
    })
    expect(event.start.toISOString()).toBe('2026-07-03T21:00:00.000Z')
    expect(event.venue?.lat).toBeTypeOf('number')
  })

  it('evento de dia inteiro usa a meia-noite de Lisboa', () => {
    const event = toDanceEvent({ ...base, start: { date: '2026-07-30' }, end: { date: '2026-08-03' } })
    expect(event.allDay).toBe(true)
    expect(event.start.toISOString()).toBe('2026-07-29T23:00:00.000Z')
    expect(event.end.toISOString()).toBe('2026-08-02T23:00:00.000Z')
  })

  it('local desconhecido fica sem coordenadas', () => {
    const event = toDanceEvent({ ...base, location: 'Lugar Novo, Rua X, Lisboa' })
    expect(event.venue).toEqual({ name: 'Lugar Novo', address: 'Rua X, Lisboa' })
  })

  it('sem location, sem venue', () => {
    const { location: _, ...withoutLocation } = base
    expect(toDanceEvent(withoutLocation).venue).toBeUndefined()
  })
})

describe('extractLinks', () => {
  it('extrai, decodifica &amp; e remove duplicados e pontuação final', () => {
    const html = 'Info: https://linktr.ee/x. Bilhetes https://a.com/?a=1&amp;b=2 e https://linktr.ee/x'
    expect(extractLinks(html)).toEqual(['https://linktr.ee/x', 'https://a.com/?a=1&b=2'])
  })

  it('sem descrição', () => {
    expect(extractLinks(undefined)).toEqual([])
  })
})
