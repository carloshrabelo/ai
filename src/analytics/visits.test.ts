import { describe, expect, it } from 'vitest'
import { countVisitOn } from './visits'

describe('countVisitOn', () => {
  it('primeira visita: visit.new e 1 dia', () => {
    expect(countVisitOn('2026-11-24', undefined)).toEqual({
      next: { first: '2026-11-24', last: '2026-11-24', days: 1 },
      events: ['visit.new', 'visit.count/1'],
    })
  })

  it('mesmo dia: não conta de novo', () => {
    const visits = { first: '2026-11-20', last: '2026-11-24', days: 3 }
    expect(countVisitOn('2026-11-24', visits)).toEqual({ next: visits, events: [] })
  })

  it('volta: total de dias e intervalo em faixas', () => {
    const at = (today: string, last: string, days: number) => countVisitOn(today, { first: '2026-10-01', last, days }).events
    expect(at('2026-11-25', '2026-11-24', 1)).toEqual(['visit.return', 'visit.count/2', 'visit.gap/1d'])
    expect(at('2026-11-30', '2026-11-24', 2)).toEqual(['visit.return', 'visit.count/3-5', 'visit.gap/2-7d'])
    expect(at('2026-12-20', '2026-11-24', 9)).toEqual(['visit.return', 'visit.count/6-10', 'visit.gap/8-30d'])
    expect(at('2027-02-01', '2026-11-24', 20)).toEqual(['visit.return', 'visit.count/11+', 'visit.gap/30d+'])
  })

  it('guarda só datas e o total (nenhum identificador)', () => {
    const { next } = countVisitOn('2026-11-25', { first: '2026-11-20', last: '2026-11-24', days: 4 })
    expect(next).toEqual({ first: '2026-11-20', last: '2026-11-25', days: 5 })
  })
})
