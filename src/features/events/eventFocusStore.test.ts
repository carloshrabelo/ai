import { beforeEach, describe, expect, it, vi } from 'vitest'
import { eventFocus } from './eventFocusStore'

describe('eventFocus', () => {
  beforeEach(() => eventFocus.reset())

  it('hover do mapa e da lista', () => {
    eventFocus.hover(['a', 'b'], 'map')
    expect(eventFocus.getState().hover).toEqual({ ids: ['a', 'b'], source: 'map' })
    eventFocus.hover(['c'], 'list')
    expect(eventFocus.getState().hover).toEqual({ ids: ['c'], source: 'list' })
  })

  it('cada origem só limpa o próprio hover', () => {
    eventFocus.hover(['a'], 'map')
    eventFocus.unhover('list')
    expect(eventFocus.getState().hover?.source).toBe('map')
    eventFocus.unhover('map')
    expect(eventFocus.getState().hover).toBeNull()
  })

  it('selecionar limpa o hover (bug: hover do pino ficava preso depois do clique)', () => {
    eventFocus.hover(['pin-event'], 'map')
    eventFocus.syncSelectedFromUrl('pin-event')
    expect(eventFocus.getState()).toEqual({ selectedId: 'pin-event', hover: null })

    eventFocus.hover(['card-event'], 'list')
    eventFocus.syncSelectedFromUrl('card-event')
    expect(eventFocus.getState()).toEqual({ selectedId: 'card-event', hover: null })
  })

  it('fechar os detalhes limpa a seleção', () => {
    eventFocus.syncSelectedFromUrl('a')
    eventFocus.syncSelectedFromUrl(null)
    expect(eventFocus.getState().selectedId).toBeNull()
  })

  it('não avisa os ouvintes quando nada muda', () => {
    const listener = vi.fn()
    const unsubscribe = eventFocus.subscribe(listener)
    eventFocus.hover(['a'], 'map')
    eventFocus.hover(['a'], 'map')
    eventFocus.unhover('list')
    eventFocus.syncSelectedFromUrl(null)
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })
})
