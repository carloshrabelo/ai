import { readText, writeText } from '../lib/storage'

// Mudança de domínio (carloshrabelo.dev/ai/ → lisbondance.com): o localStorage é por domínio, então o
// que a pessoa salvou no antigo chega aqui pelo fragmento da URL (#migrate=…, que não vai para o
// servidor), mandado pela página de redirecionamento do repositório `ai` (legacy/ai-redirect/).
// Importado antes dos stores em main.tsx: eles leem o localStorage ao carregar.

/** Chaves levadas do domínio antigo (a mesma lista em legacy/ai-redirect/redirect.js). */
export const MIGRATED_KEYS = [
  'theme',
  'locale',
  'tracked-events',
  'install-prompt-dismissed',
  'lisbon-social-dance:review-ignored',
] as const

const PREFIX = '#migrate='

/**
 * Grava os dados do fragmento `#migrate=` e o tira da URL. Só as chaves conhecidas, e sem
 * sobrescrever o que já existe aqui (o salvo no domínio novo é mais recente).
 */
export function migrateFromOldDomain(location: Pick<Location, 'hash' | 'pathname' | 'search'> = window.location) {
  if (!location.hash.startsWith(PREFIX)) return
  try {
    const data: unknown = JSON.parse(decodeURIComponent(location.hash.slice(PREFIX.length)))
    if (data && typeof data === 'object') {
      for (const key of MIGRATED_KEYS) {
        const value = (data as Record<string, unknown>)[key]
        if (typeof value === 'string' && readText(key) === null) writeText(key, value)
      }
    }
  } catch {
    // fragmento inválido: só limpa a URL
  }
  window.history.replaceState(window.history.state, '', `${location.pathname}${location.search}`)
}

migrateFromOldDomain()
