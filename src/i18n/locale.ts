import { useSyncExternalStore } from 'react'

/** Idiomas suportados. Qualquer "pt-*" usa pt-BR; o resto (e a reserva), en-US. */
export const LOCALES = ['pt-BR', 'en-US'] as const
export type Locale = (typeof LOCALES)[number]

/** "auto" segue o idioma do navegador; os outros fixam um idioma. */
export type LocaleMode = 'auto' | Locale

export const FALLBACK_LOCALE: Locale = 'en-US'

/**
 * Primeiro idioma suportado na ordem de preferência do usuário (`navigator.languages`).
 * Ex.: ["fr-FR", "pt-PT"] → pt-BR; ["de-DE"] → en-US.
 */
export function detectLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const lower = language.toLowerCase()
    if (lower.startsWith('pt')) return 'pt-BR'
    if (lower.startsWith('en')) return 'en-US'
  }
  return FALLBACK_LOCALE
}

const STORAGE_KEY = 'locale'

function readMode(): LocaleMode {
  if (!IN_BROWSER) return 'auto'
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'pt-BR' || value === 'en-US' ? value : 'auto'
  } catch {
    return 'auto'
  }
}

const IN_BROWSER = typeof window !== 'undefined' && typeof document !== 'undefined'

const browserLanguages = (): readonly string[] =>
  typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language]

type LocaleState = { mode: LocaleMode; locale: Locale }

function resolve(mode: LocaleMode): LocaleState {
  return { mode, locale: mode === 'auto' ? detectLocale(browserLanguages()) : mode }
}

let state = resolve(readMode())
const listeners = new Set<() => void>()

function apply(next: LocaleState) {
  state = next
  if (IN_BROWSER) document.documentElement.lang = next.locale
  for (const listener of listeners) listener()
}
apply(state)

// Mudou o idioma do sistema/navegador com o app aberto.
if (IN_BROWSER) {
  window.addEventListener('languagechange', () => {
    if (state.mode === 'auto') apply(resolve('auto'))
  })
}

export function setLocaleMode(mode: LocaleMode) {
  try {
    if (mode === 'auto') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Sem storage: vale só nesta sessão.
  }
  apply(resolve(mode))
}

export function useLocaleState(): LocaleState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
  )
}

/** Idioma ativo, para quem precisa fora do React (formatação). */
export const currentLocale = () => state.locale
