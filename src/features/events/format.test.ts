import { describe, expect, it } from 'vitest'
import type { DanceEvent } from '../../domain/event'
import { formatDayHeading, formatDayInSentence, formatDayOfMonth, formatShortDay, formatTimeRange, formatWeekdayShort } from './format'

const timed = {
  allDay: false,
  start: new Date('2026-07-03T21:30:00Z'), // 22:30 em Lisboa
  end: new Date('2026-07-04T03:00:00Z'), // 04:00
} as DanceEvent
const festival = { allDay: true, start: new Date('2026-07-29T23:00:00Z'), end: new Date('2026-08-02T23:00:00Z') } as DanceEvent
const oneDay = { allDay: true, start: new Date('2026-07-29T23:00:00Z'), end: new Date('2026-07-30T23:00:00Z') } as DanceEvent

describe('format pt-BR', () => {
  it('cabeçalho do dia', () => {
    expect(formatDayHeading('2026-07-11', 'pt-BR')).toBe('Sábado, 11/07')
    expect(formatDayInSentence('2026-07-11', 'pt-BR')).toBe('sábado, 11/07')
  })

  it('atalhos e faixa da semana', () => {
    expect(formatWeekdayShort('2026-07-13', 'pt-BR')).toBe('Seg')
    expect(formatDayOfMonth('2026-07-03', 'pt-BR')).toBe('3')
    expect(formatShortDay('2026-09-23', 'pt-BR')).toBe('Qua, 23/09')
  })

  it('horário (24h, fuso de Lisboa) e dia inteiro', () => {
    expect(formatTimeRange(timed, 'pt-BR')).toBe('22:30 – 04:00')
    expect(formatTimeRange(oneDay, 'pt-BR')).toBe('Dia inteiro')
    expect(formatTimeRange(festival, 'pt-BR')).toMatch(/^30\/07\s*–\s*02\/08$/)
  })
})

describe('format en-US', () => {
  it('cabeçalho do dia (mês antes do dia)', () => {
    expect(formatDayHeading('2026-07-11', 'en-US')).toBe('Saturday, 11/07')
    expect(formatDayInSentence('2026-07-11', 'en-US')).toBe('Saturday, 11/07')
  })

  it('atalhos e faixa da semana', () => {
    expect(formatWeekdayShort('2026-07-13', 'en-US')).toBe('Mon')
    expect(formatShortDay('2026-09-23', 'en-US')).toBe('Wed, 23/09')
  })

  it('horário (12h, fuso de Lisboa) e dia inteiro', () => {
    expect(formatTimeRange(timed, 'en-US').replace(/\s/g, ' ')).toBe('10:30 PM – 4:00 AM')
    expect(formatTimeRange(oneDay, 'en-US')).toBe('All day')
    expect(formatTimeRange(festival, 'en-US')).toMatch(/^30\/07\s*–\s*02\/08$/) // formato de intervalo do Intl
  })
})
