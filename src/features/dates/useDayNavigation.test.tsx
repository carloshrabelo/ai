// @vitest-environment jsdom
import '../../test/dom'
import { act, fireEvent, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { eventsInfiniteQueryOptions } from '../../api/queries'
import { addDays } from '../../lib/dates'
import { renderWithProviders, testQueryClient } from '../../test/render'
import { useFocusedDay } from './focusedDayStore'
import { useDayNavigation } from './useDayNavigation'

const START = '2026-11-24'
const DAYS = Array.from({ length: 7 }, (_, i) => addDays(START, i)) // 24 a 30/11, um título por dia
const SPACING = 1000 // cada dia ocupa 1000px na página
let scrollY = 0

/** Página de teste: área fixa, títulos de dia e botões para escolher o dia. */
function Feed() {
  const stickyRef = useRef<HTMLDivElement>(null)
  const { activeDay, selectDay } = useDayNavigation(START, stickyRef)
  return (
    <>
      <div ref={stickyRef} />
      <output>{activeDay}</output>
      {DAYS.map((day) => (
        <h2 key={day} data-day={day}>
          {day}
        </h2>
      ))}
      {DAYS.map((day) => (
        <button key={day} onClick={() => selectDay(day)}>
          ir {day}
        </button>
      ))}
    </>
  )
}

function seededClient() {
  const queryClient = testQueryClient()
  queryClient.setQueryData(eventsInfiniteQueryOptions(START).queryKey, {
    pages: [{ start: START, end: addDays(START, 14), items: [] }],
    pageParams: [START],
  })
  return queryClient
}

beforeEach(() => {
  scrollY = 0
  useFocusedDay.setState({ day: null })
  Object.defineProperty(window, 'scrollY', { get: () => scrollY, configurable: true })
  // Títulos `sticky` na mesma grade: o que já passou do topo fica grudado em top = 0 (todos empilhados);
  // com `position: static` (medição natural), cada um mede a posição real.
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const day = (this as HTMLElement).dataset.day
    if (!day) return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 })
    const natural = DAYS.indexOf(day) * SPACING - scrollY
    const top = (this as HTMLElement).style.position === 'static' ? natural : Math.max(natural, 0)
    return DOMRect.fromRect({ x: 0, y: top, width: 300, height: 30 })
  })
})
afterEach(() => vi.restoreAllMocks())

const active = () => screen.getByRole('status').textContent

describe('useDayNavigation', () => {
  it('clicar num dia anterior (título já grudado no topo) rola para cima até ele', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo')
    renderWithProviders(<Feed />, { queryClient: seededClient() })
    scrollY = 5000 // na página do dia 29/11
    fireEvent.click(screen.getByRole('button', { name: 'ir 2026-11-26' }))
    // Posição real do 26/11: 2000px. Área fixa: 0 + 8 de folga. Antes da correção, media o título grudado (0) e
    // rolava para 5000 − 8, ou seja, não subia.
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 1992, behavior: 'auto' })
    expect(active()).toBe('2026-11-26')
  })

  it('clicar num dia posterior rola para baixo até ele', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo')
    renderWithProviders(<Feed />, { queryClient: seededClient() })
    fireEvent.click(screen.getByRole('button', { name: 'ir 2026-11-29' }))
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 4992, behavior: 'auto' })
  })

  it('durante a rolagem até o dia escolhido, os dias do caminho não mudam o dia ativo', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] })
    try {
      renderWithProviders(<Feed />, { queryClient: seededClient() })
      fireEvent.click(screen.getByRole('button', { name: 'ir 2026-11-29' }))
      // A página passa pelos dias 25 a 28 a caminho do 29.
      for (const y of [1200, 2200, 3200, 4100]) {
        scrollY = y
        fireEvent.scroll(window)
        await act(() => vi.advanceTimersToNextFrame())
        expect(active()).toBe('2026-11-29')
      }
      // Página parada: a trava solta e o scroll do usuário volta a mandar.
      await act(() => vi.advanceTimersByTime(1000))
      scrollY = 2100
      fireEvent.scroll(window)
      await act(() => vi.advanceTimersToNextFrame())
      expect(active()).toBe('2026-11-26')
    } finally {
      vi.useRealTimers()
    }
  })

  it('guarda o dia ativo no focusedDayStore (agenda ↔ mapa)', () => {
    renderWithProviders(<Feed />, { queryClient: seededClient() })
    fireEvent.click(screen.getByRole('button', { name: 'ir 2026-11-27' }))
    expect(useFocusedDay.getState().day).toBe('2026-11-27')
  })
})
