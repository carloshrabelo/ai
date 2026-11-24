import { describe, expect, it } from 'vitest'
import type { GCalEvent } from '../domain/gcal'
import { cacheAgeHours, cacheItem, type EventsCache, eventsFromCache, isEventsCache, itemsInWindow } from './eventsCache'

const item = (id: string, start: string, end: string, over: Partial<GCalEvent> = {}): GCalEvent => ({
  id,
  status: 'confirmed',
  htmlLink: `https://www.google.com/calendar/event?eid=${id}`,
  summary: `Salsa • Evento ${id}`,
  start: { dateTime: start },
  end: { dateTime: end },
  ...over,
})

const items = [
  item('b', '2026-11-27T21:00:00Z', '2026-11-27T23:00:00Z'),
  item('a', '2026-11-26T19:00:00Z', '2026-11-26T23:30:00Z'),
  // Dia inteiro (tango) em 28/11.
  { ...item('c', '', ''), start: { date: '2026-11-28' }, end: { date: '2026-11-29' }, source: 'tangolx' as const },
]
const cache: EventsCache = { generatedAt: '2026-11-24T05:00:00Z', from: '2026-10-25', to: '2027-02-22', items }

describe('eventsCache', () => {
  it('janela com a regra da API (termina depois do início, começa antes do fim), ordenada', () => {
    const ids = (list: GCalEvent[]) => list.map((event) => event.id)
    expect(ids(itemsInWindow(items, new Date('2026-11-26T00:00:00Z'), new Date('2026-11-29T00:00:00Z')))).toEqual(['a', 'b', 'c'])
    expect(ids(itemsInWindow(items, new Date('2026-11-26T23:30:00Z'), new Date('2026-11-27T21:00:00Z')))).toEqual([])
  })

  it('eventos do cache em [from, to) de Lisboa, sem repetidos', () => {
    const repeated = { ...cache, items: [...items, items[0]] }
    expect(eventsFromCache(repeated, '2026-11-27', '2026-11-29').map((event) => [event.id, event.source])).toEqual([
      ['b', 'pasdedeux'],
      ['c', 'tangolx'],
    ])
  })

  it('formato e idade', () => {
    expect(isEventsCache(cache)).toBe(true)
    expect(isEventsCache({ items: [] })).toBe(false)
    expect(isEventsCache(null)).toBe(false)
    expect(cacheAgeHours(cache, Date.parse('2026-11-24T11:00:00Z'))).toBe(6)
  })
})

describe('cacheItem', () => {
  it('guarda só os campos usados (sem e-mails de creator/organizer)', () => {
    const full = { ...items[0], creator: { email: 'alguem@example.com' }, organizer: { email: 'x@group.calendar.google.com' }, etag: '"1"' }
    const kept = cacheItem(full as GCalEvent)
    expect(Object.keys(kept)).not.toContain('creator')
    expect(JSON.stringify(kept)).not.toContain('@example.com')
    expect(kept.summary).toBe(items[0].summary)
  })
})
