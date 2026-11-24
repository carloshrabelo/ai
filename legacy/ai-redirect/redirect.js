// Redireciona carloshrabelo.dev/ai/<caminho> para lisbondance.com/<caminho>, levando os dados salvos
// no aparelho (o localStorage é por domínio) no fragmento #migrate=…, que o app grava ao abrir
// (src/pwa/migrateFromOldDomain.ts no repositório lisbon-social-dances).

const NEW_ORIGIN = 'https://lisbondance.com'

/** Chaves levadas (a mesma lista de MIGRATED_KEYS em src/pwa/migrateFromOldDomain.ts). */
export const MIGRATED_KEYS = ['theme', 'locale', 'tracked-events', 'install-prompt-dismissed', 'lisbon-social-dance:review-ignored']

/** Endereço novo: mesmo caminho sem o /ai, mesma query; com dados salvos, #migrate=…. */
export function newUrl({ pathname, search, hash }, storage) {
  const path = pathname.replace(/^\/ai(?=\/|$)/, '') || '/'
  const data = {}
  for (const key of MIGRATED_KEYS) {
    try {
      const value = storage?.getItem(key)
      if (value !== null && value !== undefined) data[key] = value
    } catch {
      // sem acesso ao storage: vai sem os dados
    }
  }
  const fragment = Object.keys(data).length > 0 ? `#migrate=${encodeURIComponent(JSON.stringify(data))}` : hash
  return `${NEW_ORIGIN}${path}${search}${fragment}`
}

function storage() {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

/** Chamado pelo index.html / 404.html. */
export function go() {
  window.location.replace(newUrl(window.location, storage()))
}
