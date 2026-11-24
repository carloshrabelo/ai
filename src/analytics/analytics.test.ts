import { describe, expect, it } from 'vitest'
import { actionNames } from './analytics'

describe('actionNames', () => {
  it('evento aberto: o total e qual evento', () => {
    expect(actionNames('event.open', '2026-11-26-noite-dominicana-abcde')).toEqual([
      'event.open',
      'event.open/2026-11-26-noite-dominicana-abcde',
    ])
  })

  it('os outros cliques: só o detalhe (ou o nome, sem valor)', () => {
    expect(actionNames('filters.genre', 'Salsa')).toEqual(['filters.genre/Salsa'])
    expect(actionNames('filters.clear')).toEqual(['filters.clear'])
  })
})
