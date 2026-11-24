// @vitest-environment jsdom
import '../../test/dom'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { eventsInfiniteQueryOptions } from '../../api/queries'
import { addDays } from '../../lib/dates'
import { renderWithProviders, testQueryClient } from '../../test/render'
import { WeekStrip } from './WeekStrip'

const START = '2026-11-24'

/** Cache com uma janela de 14 dias (sem eventos), como depois do loader. */
function seededClient() {
  const queryClient = testQueryClient()
  queryClient.setQueryData(eventsInfiniteQueryOptions(START).queryKey, {
    pages: [{ start: START, end: addDays(START, 14), items: [] }],
    pageParams: [START],
  })
  return queryClient
}

const strip = () => screen.getByRole('list', { name: 'Dias' })
const days = () =>
  within(strip())
    .getAllByRole('listitem')
    .map((item) => item.dataset.stripDay)

afterEach(() => vi.restoreAllMocks())

describe('WeekStrip', () => {
  it('mostra a semana antes do início do feed e a janela carregada', () => {
    renderWithProviders(<WeekStrip startDate={START} activeDay={START} onSelect={() => {}} />, { queryClient: seededClient() })
    expect(days()[0]).toBe('2026-11-17')
    expect(days().at(-1)).toBe('2026-12-07')
    expect(days()).toHaveLength(7 + 14)
    expect(within(strip()).getByRole('button', { pressed: true }).closest('li')?.dataset.stripDay).toBe(START)
  })

  it('clicar num dia anterior ao início chama onSelect com ele', () => {
    const onSelect = vi.fn()
    renderWithProviders(<WeekStrip startDate={START} activeDay={START} onSelect={onSelect} />, { queryClient: seededClient() })
    fireEvent.click(within(strip()).getAllByRole('button')[2])
    expect(onSelect).toHaveBeenCalledWith('2026-11-19')
  })

  it('centraliza o dia ativo medindo pela própria faixa (não pelo contêiner com o botão do calendário)', () => {
    // Faixa de 200px começando em x=72 (depois do botão do calendário); dias de 50px.
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.tagName === 'UL' ? 200 : 0
    })
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (this.tagName === 'UL') return DOMRect.fromRect({ x: 72, y: 0, width: 200, height: 42 })
      const day = (this as HTMLElement).dataset.stripDay
      const index = day ? days().indexOf(day) : 0
      return DOMRect.fromRect({ x: 72 + index * 50, y: 0, width: 50, height: 42 })
    })
    const scrollTo = vi.spyOn(Element.prototype, 'scrollTo')
    renderWithProviders(<WeekStrip startDate={START} activeDay={START} onSelect={() => {}} />, { queryClient: seededClient() })
    // Dia ativo é o 8º (índice 7): esquerda 350px na faixa; centro em 200/2 → rolar 350 − (200 − 50)/2 = 275.
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 275, behavior: 'auto' })
  })

  it('perto do fim da faixa, busca mais 2 semanas', async () => {
    const queryClient = seededClient()
    renderWithProviders(<WeekStrip startDate={START} activeDay={START} onSelect={() => {}} />, { queryClient })
    const ul = strip()
    Object.defineProperties(ul, {
      scrollWidth: { value: 1000, configurable: true },
      clientWidth: { value: 300, configurable: true },
      scrollLeft: { value: 650, configurable: true, writable: true },
    })
    fireEvent.scroll(ul)
    await waitFor(() => expect(days()).toHaveLength(7 + 28))
    expect(queryClient.getQueryData(eventsInfiniteQueryOptions(START).queryKey)?.pages).toHaveLength(2)
  })
})
