// @vitest-environment jsdom
import '../../test/dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setLocaleMode } from '../../i18n/locale'
import { CalendarPicker } from './CalendarPicker'

beforeEach(() => setLocaleMode('pt-BR'))

const month = () => screen.getByText(/de 2026|de 2027/).textContent
const grid = () => screen.getByRole('group')

/** Deslize de toque na grade do mês. */
function swipe(dx: number, dy = 0, pointerType = 'touch') {
  fireEvent.pointerDown(grid(), { pointerType, pointerId: 1, clientX: 200, clientY: 200 })
  fireEvent.pointerUp(grid(), { pointerType, pointerId: 1, clientX: 200 + dx, clientY: 200 + dy })
}

describe('CalendarPicker', () => {
  it('abre no mês do dia escolhido', () => {
    render(<CalendarPicker value="2026-11-24" today="2026-11-24" onSelect={() => {}} />)
    expect(month()).toBe('novembro de 2026')
    expect(screen.getByRole('button', { pressed: true }).textContent).toBe('24')
  })

  it('deslizar para a esquerda vai para o próximo mês; para a direita, para o anterior', () => {
    render(<CalendarPicker value="2026-11-24" today="2026-11-24" onSelect={() => {}} />)
    swipe(-100)
    expect(month()).toBe('dezembro de 2026')
    swipe(100)
    swipe(100)
    expect(month()).toBe('outubro de 2026')
  })

  it('não troca de mês com deslize curto, vertical ou com o mouse', () => {
    render(<CalendarPicker value="2026-11-24" today="2026-11-24" onSelect={() => {}} />)
    swipe(-20) // curto
    swipe(-60, 120) // mais vertical que horizontal: é rolagem
    swipe(-100, 0, 'mouse')
    expect(month()).toBe('novembro de 2026')
  })

  it('o clique que vem logo depois do deslize não escolhe dia; o próximo escolhe', async () => {
    const onSelect = vi.fn()
    render(<CalendarPicker value="2026-11-24" today="2026-11-24" onSelect={onSelect} />)
    swipe(-100)
    fireEvent.click(screen.getByRole('button', { name: /, 10\/12/ }))
    expect(onSelect).not.toHaveBeenCalled()
    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.click(screen.getByRole('button', { name: /, 10\/12/ }))
    expect(onSelect).toHaveBeenCalledWith('2026-12-10')
  })

  it('PageDown e PageUp trocam o mês pelo teclado', () => {
    render(<CalendarPicker value="2026-11-24" today="2026-11-24" onSelect={() => {}} />)
    fireEvent.keyDown(grid(), { key: 'PageDown' })
    expect(month()).toBe('dezembro de 2026')
    fireEvent.keyDown(grid(), { key: 'PageUp' })
    fireEvent.keyDown(grid(), { key: 'PageUp' })
    expect(month()).toBe('outubro de 2026')
  })

  it('acompanha o dia escolhido quando ele muda por fora', () => {
    const { rerender } = render(<CalendarPicker value="2026-11-24" today="2026-11-24" onSelect={() => {}} />)
    rerender(<CalendarPicker value="2027-02-03" today="2026-11-24" onSelect={() => {}} />)
    expect(month()).toBe('fevereiro de 2027')
  })
})
