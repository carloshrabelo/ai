import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { legacyStorage } from '../lib/persistStorage'

/** Idiomas suportados. Qualquer "pt-*" usa pt-BR; o resto (e a reserva), en-US. */
const LOCALES = ['pt-BR', 'en-US'] as const
export type Locale = (typeof LOCALES)[number]

/** "auto" segue o idioma do navegador; os outros fixam um idioma. */
export type LocaleMode = 'auto' | Locale

const FALLBACK_LOCALE: Locale = 'en-US'

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

const IN_BROWSER = typeof window !== 'undefined' && typeof document !== 'undefined'

const browserLanguages = (): readonly string[] =>
  typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language]

type LocaleState = { mode: LocaleMode; locale: Locale }

function resolve(mode: LocaleMode): LocaleState {
  return { mode, locale: mode === 'auto' ? detectLocale(browserLanguages()) : mode }
}

/**
 * Idioma escolhido e idioma ativo. Só o modo é salvo, no formato antigo: `locale` guarda "pt-BR" ou
 * "en-US" em texto puro, e "Automático" apaga a chave.
 */
const useLocaleStore = create<LocaleState>()(
  persist(() => resolve('auto'), {
    name: STORAGE_KEY,
    partialize: ({ mode }) => ({ mode }),
    storage: legacyStorage<{ mode: LocaleMode }>({
      parse: (text) => (text === 'pt-BR' || text === 'en-US' ? { mode: text } : undefined),
      serialize: ({ mode }) => (mode === 'auto' ? null : mode),
    }),
    // O idioma ativo é derivado do modo salvo.
    merge: (persisted, current) => ({ ...current, ...resolve((persisted as Partial<LocaleState> | undefined)?.mode ?? current.mode) }),
  }),
)

const applyLang = (locale: Locale) => {
  if (IN_BROWSER) document.documentElement.lang = locale
}
applyLang(useLocaleStore.getState().locale)
useLocaleStore.subscribe((state, previous) => {
  if (state.locale !== previous.locale) applyLang(state.locale)
})

// Mudou o idioma do sistema/navegador com o app aberto.
if (IN_BROWSER) {
  window.addEventListener('languagechange', () => {
    if (useLocaleStore.getState().mode === 'auto') useLocaleStore.setState(resolve('auto'))
  })
}

export function setLocaleMode(mode: LocaleMode) {
  useLocaleStore.setState(resolve(mode))
}

export function useLocaleState(): LocaleState {
  return useLocaleStore(useShallow(({ mode, locale }) => ({ mode, locale })))
}
