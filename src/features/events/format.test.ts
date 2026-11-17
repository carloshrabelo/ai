import { describe, expect, it } from 'vitest'
import { formatDayHeading, formatDayOfMonth, formatShortDay, formatWeekdayShort } from './format'

describe('format', () => {
  it('cabeçalho do dia', () => {
    expect(formatDayHeading('2026-07-11')).toBe('Sábado, 11/07')
  })

  it('atalhos e faixa da semana', () => {
    expect(formatWeekdayShort('2026-07-13')).toBe('Seg')
    expect(formatDayOfMonth('2026-07-03')).toBe('3')
    expect(formatShortDay('2026-09-23')).toBe('Qua, 23/09')
  })
})
