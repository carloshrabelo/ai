// @vitest-environment jsdom
import { setViewport } from '../../test/dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setLocaleMode } from '../../i18n/locale'
import { DayShortcuts } from './DayShortcuts'

beforeEach(() => setLocaleMode('pt-BR'))

const TODAY = '2026-11-24'
const buttons = () => within(screen.getByRole('group', { name: 'Atalhos de dia' })).getAllByRole('button')

describe('DayShortcuts', () => {
  it('Ontem, Hoje, Amanhã e Outra data, com o dia ativo marcado', () => {
    render(<DayShortcuts today={TODAY} activeDay={TODAY} onSelect={() => {}} />)
    expect(buttons().map((button) => button.textContent)).toEqual(['Ontem', 'Hoje', 'Amanhã', 'Outra data'])
    expect(screen.getByRole('button', { pressed: true }).textContent).toBe('Hoje')
  })

  it('atalho escolhe o dia', () => {
    const onSelect = vi.fn()
    render(<DayShortcuts today={TODAY} activeDay={TODAY} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Amanhã' }))
    expect(onSelect).toHaveBeenCalledWith('2026-11-25')
    fireEvent.click(screen.getByRole('button', { name: 'Ontem' }))
    expect(onSelect).toHaveBeenCalledWith('2026-11-23')
  })

  it('dia fora dos atalhos: "Outra data" fica ativo e mostra o dia', () => {
    render(<DayShortcuts today={TODAY} activeDay="2026-12-10" onSelect={() => {}} />)
    const other = buttons().at(-1)!
    expect(other.getAttribute('aria-pressed')).toBe('true')
    expect(other.textContent).toBe('Qui, 10/12')
    expect(other.getAttribute('aria-label')).toBe('Escolher data: Qui, 10/12')
  })

  it('"Outra data" abre o calendário numa folha (celular) e escolher um dia chama onSelect', () => {
    const onSelect = vi.fn()
    render(<DayShortcuts today={TODAY} activeDay={TODAY} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Escolher data' }))
    const sheet = document.querySelector('dialog[open]') as HTMLElement
    expect(sheet.getAttribute('aria-label')).toBe('Escolher data')
    fireEvent.click(within(sheet).getByRole('button', { name: /, 10\/11/ }))
    expect(onSelect).toHaveBeenCalledWith('2026-11-10')
  })

  it('no desktop (xl), o calendário abre num popover e fecha com Esc', () => {
    setViewport(1440)
    render(<DayShortcuts today={TODAY} activeDay={TODAY} onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Escolher data' }))
    expect(screen.getByRole('dialog', { name: 'Escolher data' }).tagName).toBe('DIV')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
