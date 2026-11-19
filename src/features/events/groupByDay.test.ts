import { describe, expect, it } from 'vitest'
import type { DanceEvent } from '../../domain/event'
import { groupByDay } from './groupByDay'

function event(id: string, start: string, end: string, allDay = false): DanceEvent {
  return {
    id,
    slug: id,
    title: id,
    genres: [],
    rawTag: '',
    start: new Date(start),
    end: new Date(end),
    allDay,
    links: [],
    calendarUrl: '',
    source: 'pasdedeux',
  }
}

const days = (result: ReturnType<typeof groupByDay>) => result.map(({ day, events }) => `${day}: ${events.map((e) => e.id).join(',')}`)

describe('groupByDay', () => {
  it('evento que passa da meia-noite aparece só no dia em que começa', () => {
    const party = event('festa', '2026-07-03T22:00:00+01:00', '2026-07-04T04:00:00+01:00')
    expect(days(groupByDay([party], '2026-07-01', '2026-07-15'))).toEqual(['2026-07-03: festa'])
  })

  it('evento de dia inteiro aparece em todos os dias do intervalo (fim exclusivo)', () => {
    const festival = event('festival', '2026-07-29T23:00:00Z', '2026-08-02T23:00:00Z', true) // 30/07 → 02/08
    expect(days(groupByDay([festival], '2026-07-27', '2026-08-10'))).toEqual([
      '2026-07-30: festival',
      '2026-07-31: festival',
      '2026-08-01: festival',
      '2026-08-02: festival',
    ])
  })

  it('recorta pelo intervalo carregado', () => {
    const festival = event('festival', '2026-07-29T23:00:00Z', '2026-08-02T23:00:00Z', true)
    expect(days(groupByDay([festival], '2026-08-01', '2026-08-02'))).toEqual(['2026-08-01: festival'])
  })

  it('usa o dia de Lisboa, não o UTC', () => {
    const late = event('tarde', '2026-07-03T23:30:00Z', '2026-07-04T01:00:00Z') // 00:30 de 04/07 em Lisboa
    expect(days(groupByDay([late], '2026-07-01', '2026-07-15'))).toEqual(['2026-07-04: tarde'])
  })

  it('dia inteiro primeiro, depois por horário', () => {
    const list = [
      event('noite', '2026-07-03T22:00:00+01:00', '2026-07-04T02:00:00+01:00'),
      event('tarde', '2026-07-03T16:00:00+01:00', '2026-07-03T20:00:00+01:00'),
      event('festival', '2026-07-02T23:00:00Z', '2026-07-03T23:00:00Z', true),
    ]
    expect(days(groupByDay(list, '2026-07-01', '2026-07-15'))).toEqual(['2026-07-03: festival,tarde,noite'])
  })
})
