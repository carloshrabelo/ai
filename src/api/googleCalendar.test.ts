import { describe, expect, it, vi } from 'vitest'
import type { GCalEvent } from '../domain/gcal'
import { mergeCalendarResults } from './googleCalendar'

const item = (id: string, start: string, source?: GCalEvent['source']): GCalEvent => ({
  id,
  status: 'confirmed',
  htmlLink: '',
  start: { dateTime: start },
  end: { dateTime: start.replace('T19', 'T23') },
  ...(source ? { source } : {}),
})

const window = { timeMin: new Date('2026-11-26T00:00:00Z'), timeMax: new Date('2026-12-10T00:00:00Z') }
const ok = (value: GCalEvent[]): PromiseSettledResult<GCalEvent[]> => ({ status: 'fulfilled', value })
const failed: PromiseSettledResult<GCalEvent[]> = { status: 'rejected', reason: new Error('HTTP 403') }
const ids = (list: GCalEvent[]) => list.map((event) => event.id)

// Na ordem de CALENDAR_SOURCES: pasdedeux, tangolx, tradicionais.
const cached = [
  item('cache-main', '2026-11-27T19:00:00Z', 'pasdedeux'),
  item('cache-tango', '2026-11-28T19:00:00Z', 'tangolx'),
  item('cache-old', '2026-11-01T19:00:00Z', 'pasdedeux'), // fora da janela
]

describe('mergeCalendarResults', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})

  it('tudo certo: junta os calendários, ordenados pelo início', () => {
    const merged = mergeCalendarResults(
      [ok([item('m', '2026-11-29T19:00:00Z', 'pasdedeux')]), ok([item('t', '2026-11-27T19:00:00Z', 'tangolx')]), ok([])],
      undefined,
      window,
    )
    expect(ids(merged)).toEqual(['t', 'm'])
  })

  it('calendário que falha entra pelo cache, só os dele e só na janela', () => {
    const merged = mergeCalendarResults([ok([item('m', '2026-11-29T19:00:00Z', 'pasdedeux')]), failed, ok([])], cached, window)
    expect(ids(merged)).toEqual(['cache-tango', 'm'])
  })

  it('principal falhando com cache: a agenda abre com o cache', () => {
    expect(ids(mergeCalendarResults([failed, failed, failed], cached, window))).toEqual(['cache-main', 'cache-tango'])
  })

  it('sem cache: extra que falha fica de fora; o principal lança o erro', () => {
    expect(ids(mergeCalendarResults([ok([item('m', '2026-11-29T19:00:00Z')]), failed, ok([])], undefined, window))).toEqual(['m'])
    expect(() => mergeCalendarResults([failed, ok([]), ok([])], undefined, window)).toThrow('HTTP 403')
  })
})
