import type { Messages } from './i18n/messages'

/**
 * Nome do app e a parceria com o Pas de Deux (de onde vêm os eventos), exibida menor ao lado. Mudar
 * também em index.html, no manifest do PWA (vite.config.ts) e nos títulos (src/i18n, src/seo/prerender.ts).
 */
export const APP_NAME = 'Lisbon Dance'
export const APP_PARTNER = 'with Pas de Deux'
export const APP_FULL_NAME = `${APP_NAME} ${APP_PARTNER}`

/** Metadados por rota, lidos pelo Header via useMatches(). */
export type RouteHandle = {
  /** Título no idioma ativo; sem título, o Header mostra APP_NAME. */
  title?: (t: Messages) => string
}
