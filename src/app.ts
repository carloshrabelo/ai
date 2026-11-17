import type { Messages } from './i18n/messages'

/** Nome do app. Mudar também em index.html e no manifest do PWA (vite.config.ts). */
export const APP_NAME = 'Lisbon Social Dance'

/** Metadados por rota, lidos pelo Header via useMatches(). */
export type RouteHandle = {
  /** Título no idioma ativo; sem título, o Header mostra APP_NAME. */
  title?: (t: Messages) => string
}
