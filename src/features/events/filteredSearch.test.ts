import { describe, expect, it } from 'vitest'
import type { DanceEventsPage } from '../../data/queries'
import type { DanceEvent } from '../../domain/event'
import type { Genre } from '../../domain/genres'
import { lastSearchedDay, shouldPauseFilteredSearch, trailingMisses } from './filteredSearch'

const event = (genres: Genre[]) => ({ genres }) as DanceEvent
const page = (start: string, end: string, ...events: DanceEvent[]): DanceEventsPage => ({ start, end, events })

const pages = [
  page('2026-11-17', '2026-12-01', event(['Salsa']), event(['Forró'])),
  page('2026-12-01', '2026-12-15', event(['Forró'])),
  page('2026-12-15', '2026-12-29', event(['Kizomba'])),
  page('2026-12-29', '2027-01-12'),
]

describe('filteredSearch', () => {
  it('conta janelas seguidas sem resultado, do fim para o começo', () => {
    expect(trailingMisses(pages, ['Salsa'])).toBe(3)
    expect(trailingMisses(pages, ['Kizomba'])).toBe(1)
    expect(trailingMisses(pages, ['Forró'])).toBe(2)
  })

  it('pausa só com filtro ativo e 3 janelas sem resultado', () => {
    expect(shouldPauseFilteredSearch(pages, ['Salsa'])).toBe(true)
    expect(shouldPauseFilteredSearch(pages, ['Forró'])).toBe(false)
    expect(shouldPauseFilteredSearch(pages, [])).toBe(false)
  })

  it('"buscar mais" zera a contagem a partir daquela janela', () => {
    expect(trailingMisses(pages, ['Salsa'], 3)).toBe(1)
    expect(shouldPauseFilteredSearch(pages, ['Salsa'], 3)).toBe(false)
  })

  it('último dia buscado é o fim da última janela menos 1 (fim exclusivo)', () => {
    expect(lastSearchedDay(pages, '2026-11-17')).toBe('2027-01-11')
    expect(lastSearchedDay([], '2026-11-17')).toBe('2026-11-17')
  })
})
