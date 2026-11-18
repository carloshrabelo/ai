import { describe, expect, it } from 'vitest'
import { slugFromPath, eventPath } from '../features/events/useSelectedEvent'
import { agendaFromPath, agendaOf, eventPagePath } from './agenda'

describe('agendas', () => {
  it('evento de danças tradicionais vai para /tradicionais; o resto fica na dança', () => {
    expect(agendaOf(['Tradicionais'])).toBe('tradicionais')
    expect(agendaOf(['Salsa', 'Bachata'])).toBe('dance')
    expect(agendaOf([])).toBe('dance')
  })

  it('agenda da página pelo caminho', () => {
    expect(agendaFromPath('/tradicionais')).toBe('tradicionais')
    expect(agendaFromPath('/tradicionais/evento/x-2026-11-20/')).toBe('tradicionais')
    expect(agendaFromPath('/')).toBe('dance')
    expect(agendaFromPath('/evento/x/')).toBe('dance')
    expect(agendaFromPath('/tradicionaisx')).toBe('dance')
  })

  it('página estática e caminho no app de cada agenda', () => {
    expect(eventPagePath({ slug: 'ball-trad-2026-11-20', genres: ['Tradicionais'] })).toBe('tradicionais/evento/ball-trad-2026-11-20/')
    expect(eventPagePath({ slug: 'salsa-2026-11-20', genres: ['Salsa'] })).toBe('evento/salsa-2026-11-20/')
    expect(eventPath('x', 'tradicionais')).toBe('/tradicionais/evento/x/')
    expect(eventPath('x')).toBe('/evento/x/')
  })

  it('slug no caminho das duas agendas', () => {
    expect(slugFromPath('/tradicionais/evento/ball-trad-2026-11-20/')).toBe('ball-trad-2026-11-20')
    expect(slugFromPath('/evento/salsa-2026-11-20')).toBe('salsa-2026-11-20')
    expect(slugFromPath('/tradicionais/')).toBeNull()
  })
})
