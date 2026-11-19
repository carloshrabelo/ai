import { describe, expect, it } from 'vitest'
import type { DanceEvent } from '../../domain/event'
import { googleCalendarUrl, icsContent } from './calendarLinks'

const event: DanceEvent = {
  id: 'abc123',
  slug: 'abc123',
  title: 'Samba no Mercado',
  genres: ['Samba'],
  rawTag: 'Samba',
  start: new Date('2026-11-17T20:00:00Z'),
  end: new Date('2026-11-17T23:45:00Z'),
  allDay: false,
  venue: { location: 'Time Out', name: 'Time Out Market Lisboa', address: 'Av. 24 de Julho 49, Lisboa', lat: 38.7, lng: -9.14 },
  description: 'Mais info:<br>@dance &amp; amigos',
  links: [],
  calendarUrl: 'https://www.google.com/calendar/event?eid=x',
  source: 'pasdedeux',
}
const page = 'https://carloshrabelo.github.io/ai/event/2026-11-17-samba-no-mercado-abcde/'

describe('googleCalendarUrl', () => {
  it('modelo do Google Agenda com título, datas UTC, local e descrição', () => {
    const url = new URL(googleCalendarUrl(event, page))
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      action: 'TEMPLATE',
      text: 'Samba no Mercado',
      dates: '20261117T200000Z/20261117T234500Z',
      ctz: 'Europe/Lisbon',
      details: `${page}\n\nMais info:\n@dance & amigos`,
      location: 'Time Out Market Lisboa, Av. 24 de Julho 49, Lisboa',
    })
  })

  it('dia inteiro usa só as datas de Lisboa (fim exclusivo)', () => {
    const allDay = { ...event, allDay: true, start: new Date('2026-07-29T23:00:00Z'), end: new Date('2026-08-02T23:00:00Z') }
    expect(new URL(googleCalendarUrl(allDay, page)).searchParams.get('dates')).toBe('20260730/20260803')
  })
})

describe('icsContent', () => {
  const ics = icsContent(event, page, new Date('2026-11-01T10:00:00Z'))

  it('VEVENT com datas, local, geo e URL; linhas terminadas em CRLF', () => {
    expect(ics).toContain('BEGIN:VEVENT\r\n')
    expect(ics).toContain('UID:abc123@lisbon-social-dance\r\n')
    expect(ics).toContain('DTSTART:20261117T200000Z\r\n')
    expect(ics).toContain('DTEND:20261117T234500Z\r\n')
    expect(ics).toContain('SUMMARY:Samba no Mercado\r\n')
    expect(ics).toContain('LOCATION:Time Out Market Lisboa\\, Av. 24 de Julho 49\\, Lisboa\r\n')
    expect(ics).toContain('GEO:38.7;-9.14\r\n')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('quebra linhas com mais de 75 octetos', () => {
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
  })

  it('cancelado leva STATUS:CANCELLED', () => {
    expect(icsContent({ ...event, status: 'cancelled' }, page)).toContain('STATUS:CANCELLED')
  })
})
