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
    expect(eventFocus.getState()).toMatchObject({ selectedSlug: 'pin-event', hover: null })

    eventFocus.hover(['card-event'], 'list')
    eventFocus.syncSelectedFromUrl('card-event')
    expect(eventFocus.getState()).toMatchObject({ selectedSlug: 'card-event', hover: null })
  })

  it('guarda de onde a seleção veio', () => {
    eventFocus.willSelectFrom('list', 'a')
    eventFocus.syncSelectedFromUrl('a')
    expect(eventFocus.getState().selectedFrom).toBe('list')

    eventFocus.willSelectFrom('map', 'b')
    eventFocus.syncSelectedFromUrl('b')
    expect(eventFocus.getState().selectedFrom).toBe('map')
  })

  it('reabrir o mesmo evento por outra origem troca a origem (a URL não muda)', () => {
    eventFocus.willSelectFrom('map', 'a')
    eventFocus.syncSelectedFromUrl('a')
    eventFocus.willSelectFrom('list', 'a')
    expect(eventFocus.getState()).toMatchObject({ selectedSlug: 'a', selectedFrom: 'list' })
  })

  it('seleção vinda da URL (link direto, voltar) não tem origem', () => {
    eventFocus.syncSelectedFromUrl('a')
    expect(eventFocus.getState().selectedFrom).toBeNull()
  })

  it('fechar limpa a origem', () => {
    eventFocus.willSelectFrom('list', 'a')
    eventFocus.syncSelectedFromUrl('a')
    eventFocus.syncSelectedFromUrl(null)
    expect(eventFocus.getState()).toMatchObject({ selectedSlug: null, selectedFrom: null })
  })

  it('fechar os detalhes limpa a seleção', () => {
    eventFocus.syncSelectedFromUrl('a')
    eventFocus.syncSelectedFromUrl(null)
    expect(eventFocus.getState().selectedSlug).toBeNull()
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
