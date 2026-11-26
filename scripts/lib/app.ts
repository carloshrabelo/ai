// Início comum dos scripts que usam o código do app (src/) no Node: um servidor do Vite só para
// carregar módulos (ssrLoadModule), com o Referer que a chave da Google Calendar API exige.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

export const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** Domínio publicado: a chave da API é restrita por HTTP referrer. */
export const PUBLISHED_URL = 'https://lisbondance.com/'

type Options = {
  /** Nome do script (aparece em __APP_VERSION__). */
  name: string
  /** Referer mandado à Google Calendar API (padrão: o site publicado). */
  referer?: string
  /** Sempre a API real, nunca o mock (o ambiente vence o .env.local no Vite). */
  realData?: boolean
}

export type App = {
  /** Carrega um módulo de src/ ('/src/api/loadEvents.ts'), tipado por quem chama. */
  load: <T>(path: string) => Promise<T>
  close: () => Promise<void>
}

export async function startApp({ name, referer = PUBLISHED_URL, realData = false }: Options): Promise<App> {
  if (realData) process.env.VITE_USE_MOCK = 'false'
  // Chave própria dos scripts (no Actions, sem restrição de domínio), se houver: o código do app lê
  // VITE_GOOGLE_API_KEY, e o ambiente vence o .env.local no Vite.
  const scriptsKey = process.env.VITE_GOOGLE_API_KEY_SCRIPTS?.trim()
  if (scriptsKey) process.env.VITE_GOOGLE_API_KEY = scriptsKey
  console.log(
    `${name}: chave da API ${scriptsKey ? 'dos scripts' : process.env.VITE_GOOGLE_API_KEY ? 'do site' : 'do .env.local (ou nenhuma)'}`,
  )

  const originalFetch = globalThis.fetch
  globalThis.fetch = (input, init = {}) => {
    const url = String(input instanceof Request ? input.url : input)
    if (!url.startsWith('https://www.googleapis.com/')) return originalFetch(input, init)
    const headers = new Headers(init.headers)
    headers.set('Referer', referer)
    return originalFetch(input, { ...init, headers })
  }

  const vite = await createServer({
    root,
    configFile: false,
    logLevel: 'warn',
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false },
    define: { __APP_VERSION__: JSON.stringify(name), __APP_BUILD_TIME__: '""', __PWA_IN_DEV__: 'false' },
  })
  return { load: async <T>(path: string) => (await vite.ssrLoadModule(path)) as T, close: () => vite.close() }
}
