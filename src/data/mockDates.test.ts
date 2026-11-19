import { describe, expect, it } from 'vitest'
import mock from '../mocks/events.json'
import { addDays, lisbonDate } from './dates'
import type { GCalEvent } from './googleCalendar'
import { shiftMockEvents } from './mockDates'

const items = mock.items as GCalEvent[]
const startDay = (e: GCalEvent) => e.start.date ?? lisbonDate(new Date(e.start.dateTime!))

describe('shiftMockEvents', () => {
  // Uma data para cada dia da semana, mais datas no inverno e no verão.
  const todays = [
    '2026-11-16',
    '2026-11-17',
    '2026-11-18',
    '2026-11-19',
    '2026-11-20',
    '2026-11-21',
    '2026-11-22',
    '2027-03-28',
    '2027-08-15',
  ]

  it.each(todays)('hoje = %s: há eventos na semana passada, hoje e na próxima', (today) => {
    const days = shiftMockEvents(items, today).map(startDay)
    const between = (from: number, to: number) => days.some((d) => d >= addDays(today, from) && d <= addDays(today, to))

    expect(between(-7, -1)).toBe(true)
    expect(between(0, 0)).toBe(true)
    expect(between(1, 7)).toBe(true)
  })

  it.each(todays)('hoje = %s: pelo menos 3 dias com eventos na semana passada e 3 na próxima', (today) => {
    const days = new Set(shiftMockEvents(items, today).map(startDay))
    const countDays = (from: number, to: number) => [...days].filter((d) => d >= addDays(today, from) && d <= addDays(today, to)).length

    expect(countDays(-7, -1)).toBeGreaterThanOrEqual(3)
    expect(countDays(1, 7)).toBeGreaterThanOrEqual(3)
  })

  it('desloca em dias inteiros: horários e durações não mudam', () => {
    const shifted = shiftMockEvents(items, '2026-11-17')
    shifted.forEach((event, i) => {
      const duration = (e: GCalEvent) =>
        new Date(e.end.dateTime ?? e.end.date!).getTime() - new Date(e.start.dateTime ?? e.start.date!).getTime()
      expect(Math.abs(duration(event) - duration(items[i]))).toBeLessThanOrEqual(3_600_000) // ±1h de mudança de horário
    })
  })

  it('mantém o horário de Lisboa mesmo passando do verão (+01:00) para o inverno (+00:00)', () => {
    const [event] = shiftMockEvents(
      [{ ...items[0], start: { dateTime: '2026-07-03T22:00:00+01:00' }, end: { dateTime: '2026-07-04T04:00:00+01:00' } }],
      '2026-12-10',
    )
    expect(event.start.dateTime).toMatch(/T22:00:00\.000Z$/) // 22:00 em Lisboa no inverno = 22:00 UTC
  })

  it('não altera os outros campos', () => {
    const [event] = shiftMockEvents(items, '2026-11-17')
    expect(event.summary).toBe(items[0].summary)
    expect(event.id).toBe(items[0].id)
  })
})
