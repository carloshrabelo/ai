import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'
import { jsonCodec, legacyStorage } from './persistStorage'

/** localStorage em memória (os testes rodam fora do navegador). */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

let storage: ReturnType<typeof memoryStorage>
beforeEach(() => {
  storage = memoryStorage({ theme: 'dark', 'tracked-events': '{"a":{"title":"A"}}' })
  vi.stubGlobal('window', { localStorage: storage })
})
afterEach(() => vi.unstubAllGlobals())

const themeStore = () =>
  createStore<{ mode: string }>()(
    persist(() => ({ mode: 'system' }), {
      name: 'theme',
      storage: legacyStorage<{ mode: string }>({
        parse: (text) => (text === 'light' || text === 'dark' ? { mode: text } : undefined),
        serialize: ({ mode }) => (mode === 'system' ? null : mode),
      }),
    }),
  )

describe('legacyStorage', () => {
  it('lê o texto puro salvo antes do Zustand', () => {
    expect(themeStore().getState().mode).toBe('dark')
  })

  it('grava no mesmo formato (sem o envelope { state, version })', () => {
    const store = themeStore()
    store.setState({ mode: 'light' })
    expect(storage.data.get('theme')).toBe('light')
    store.setState({ mode: 'system' })
    expect(storage.data.has('theme')).toBe(false)
  })

  it('JSON antigo sem envelope', () => {
    const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
    const json = jsonCodec(isRecord)
    const store = createStore<{ events: Record<string, unknown> }>()(
      persist(() => ({ events: {} }), {
        name: 'tracked-events',
        storage: legacyStorage<{ events: Record<string, unknown> }>({
          parse: (text) => {
            const events = json.parse(text)
            return events && { events }
          },
          serialize: ({ events }) => json.serialize(events),
        }),
      }),
    )
    expect(store.getState().events).toEqual({ a: { title: 'A' } })
    store.setState({ events: { b: 1 } })
    expect(storage.data.get('tracked-events')).toBe('{"b":1}')
  })

  it('valor inválido fica no padrão', () => {
    storage.data.set('theme', 'roxo')
    expect(themeStore().getState().mode).toBe('system')
  })

  it('sem localStorage, funciona em memória', () => {
    vi.stubGlobal('window', {})
    const store = themeStore()
    expect(store.getState().mode).toBe('system')
    store.setState({ mode: 'dark' })
    expect(store.getState().mode).toBe('dark')
  })
})
