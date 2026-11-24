// @vitest-environment jsdom
import { setViewport } from '../../test/dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setLocaleMode } from '../../i18n/locale'
import { DayShortcuts } from './DayShortcuts'

// Relógio do app controlado pelo teste: de dia (15:00) ou de madrugada (01:00), em Lisboa (inverno = UTC).
const clock = vi.hoisted(() => ({ now: Date.parse('2026-11-24T15:00:00Z') }))
vi.mock('../../hooks/useNow', () => ({ useNow: () => clock.now }))
const AFTERNOON = Date.parse('2026-11-24T15:00:00Z')
const LATE_NIGHT = Date.parse('2026-11-25T01:00:00Z') // a agenda ainda está no dia 24

beforeEach(() => {
  setLocaleMode('pt-BR')
  clock.now = AFTERNOON
})

const TODAY = '2026-11-24'
const buttons = () => within(screen.getByRole('group', { name: 'Atalhos de dia' })).getAllByRole('button')

describe('DayShortcuts', () => {
  it('de dia: Hoje, Amanhã e Outra data (sem Ontem), com o dia ativo marcado', () => {
    render(<DayShortcuts today={TODAY} activeDay={TODAY} onSelect={() => {}} />)
    expect(buttons().map((button) => button.textContent)).toEqual(['Hoje', 'Amanhã', 'Outra data'])
    expect(screen.getByRole('button', { pressed: true }).textContent).toBe('Hoje')
  })

  it('de madrugada (00:00 às 05:00): Ontem aparece antes de Hoje', () => {
    clock.now = LATE_NIGHT
    render(<DayShortcuts today={TODAY} activeDay={TODAY} onSelect={() => {}} />)
    expect(buttons().map((button) => button.textContent)).toEqual(['Ontem', 'Hoje', 'Amanhã', 'Outra data'])
  })

  it('com ontem em foco: Ontem aparece marcado e "Outra data" mostra a data, sem marcar', () => {
    render(<DayShortcuts today={TODAY} activeDay="2026-11-23" onSelect={() => {}} />)
    expect(buttons().map((button) => button.textContent)).toEqual(['Ontem', 'Hoje', 'Amanhã', 'Seg, 23/11'])
    expect(screen.getAllByRole('button', { pressed: true }).map((button) => button.textContent)).toEqual(['Ontem'])
    expect(buttons().at(-1)!.getAttribute('aria-label')).toBe('Seg, 23/11 (Outra data)')
  })

  it('atalho escolhe o dia', () => {
    clock.now = LATE_NIGHT
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
    expect(other.getAttribute('aria-label')).toBe('Qui, 10/12 (Outra data)')
  })

  it('"Outra data" abre o calendário numa folha (celular) e escolher um dia chama onSelect', () => {
    const onSelect = vi.fn()
    render(<DayShortcuts today={TODAY} activeDay={TODAY} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Outra data' }))
    const sheet = document.querySelector('dialog[open]') as HTMLElement
    expect(sheet.getAttribute('aria-label')).toBe('Escolher data')
    fireEvent.click(within(sheet).getByRole('button', { name: /, 10\/11/ }))
    expect(onSelect).toHaveBeenCalledWith('2026-11-10')
  })

  it('no desktop (xl), o calendário abre num popover e fecha com Esc', () => {
    setViewport(1440)
    render(<DayShortcuts today={TODAY} activeDay={TODAY} onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Outra data' }))
    expect(screen.getByRole('dialog', { name: 'Escolher data' }).tagName).toBe('DIV')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
