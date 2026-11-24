import { describe, expect, it } from 'vitest'
import { agendaToday, todayIso } from './dates'

describe('agendaToday', () => {
  it('até as 05:00 de Lisboa ainda é o dia anterior', () => {
    // Inverno (Lisboa = UTC): 25/11 às 00:30, 02:00 e 04:59 → dia 24.
    expect(agendaToday(new Date('2026-11-25T00:30:00Z'))).toBe('2026-11-24')
    expect(agendaToday(new Date('2026-11-25T04:59:00Z'))).toBe('2026-11-24')
    expect(todayIso(new Date('2026-11-25T04:59:00Z'))).toBe('2026-11-25')
  })

  it('a partir das 05:00 é o dia de calendário', () => {
    expect(agendaToday(new Date('2026-11-25T05:00:00Z'))).toBe('2026-11-25')
    expect(agendaToday(new Date('2026-11-25T23:59:00Z'))).toBe('2026-11-25')
  })

  it('no horário de verão (Lisboa = UTC+1) usa a hora de Lisboa', () => {
    // 04:30 em Lisboa = 03:30 UTC → ainda dia 3; 05:10 em Lisboa = 04:10 UTC → dia 4.
    expect(agendaToday(new Date('2026-07-04T03:30:00Z'))).toBe('2026-07-03')
    expect(agendaToday(new Date('2026-07-04T04:10:00Z'))).toBe('2026-07-04')
  })
})
