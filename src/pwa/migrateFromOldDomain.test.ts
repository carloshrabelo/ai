// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error: JS puro do repositório `ai` de redirecionamento, sem tipos
import { MIGRATED_KEYS as SENT_KEYS, newUrl } from '../../legacy/ai-redirect/redirect.js'
import { MIGRATED_KEYS, migrateFromOldDomain } from './migrateFromOldDomain'

/** Storage em memória, como o localStorage do domínio antigo. */
function memoryStorage(entries: Record<string, string>) {
  return { getItem: (key: string) => entries[key] ?? null }
}

const at = (url: string) => {
  const { pathname, search, hash } = new URL(url)
  return { pathname, search, hash }
}

afterEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

describe('mudança de domínio', () => {
  it('o redirecionamento manda as mesmas chaves que o app grava', () => {
    expect(SENT_KEYS).toEqual([...MIGRATED_KEYS])
  })

  it('leva o caminho sem /ai, a query e o hash (sem dados salvos)', () => {
    const empty = memoryStorage({})
    expect(newUrl(at('https://carloshrabelo.dev/ai/'), empty)).toBe('https://lisbondance.com/')
    expect(newUrl(at('https://carloshrabelo.dev/ai'), empty)).toBe('https://lisbondance.com/')
    expect(newUrl(at('https://carloshrabelo.dev/ai/event/2026-11-26-noite-abc/?date=2026-11-26#x'), empty)).toBe(
      'https://lisbondance.com/event/2026-11-26-noite-abc/?date=2026-11-26#x',
    )
    // Só o prefixo /ai, não um caminho que começa com "ai".
    expect(newUrl(at('https://carloshrabelo.dev/aikido/'), empty)).toBe('https://lisbondance.com/aikido/')
  })

  it('leva os dados salvos e o app novo grava só as chaves conhecidas, sem sobrescrever', () => {
    const tracked = JSON.stringify({ e1: { title: 'Forró à noite' } })
    const old = memoryStorage({ theme: 'dark', 'tracked-events': tracked, locale: 'en', other: 'x' })
    const url = newUrl(at('https://carloshrabelo.dev/ai/map/?g=salsa'), old)
    expect(url).toMatch(/^https:\/\/lisbondance\.com\/map\/\?g=salsa#migrate=/)

    localStorage.setItem('locale', 'pt')
    window.history.replaceState(null, '', url.replace('https://lisbondance.com', ''))
    migrateFromOldDomain()

    expect(localStorage.getItem('theme')).toBe('dark')
    expect(localStorage.getItem('tracked-events')).toBe(tracked)
    expect(localStorage.getItem('locale')).toBe('pt')
    expect(localStorage.getItem('other')).toBeNull()
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe('/map/?g=salsa')
  })

  it('fragmento inválido: não grava nada e limpa a URL', () => {
    window.history.replaceState(null, '', '/#migrate=%7Bnope')
    migrateFromOldDomain()
    expect(localStorage.length).toBe(0)
    expect(window.location.hash).toBe('')
  })
})
