import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { legacyStorage } from '../lib/persistStorage'

export type ThemeMode = 'light' | 'dark' | 'system'

/** Mesma chave lida pelo script inline do index.html (evita piscar no carregamento). */
const STORAGE_KEY = 'theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * Cor da barra do navegador/PWA em cada tema: a do header (`--header` em index.css). Mesmos valores
 * no script inline do index.html e no manifest (vite.config.ts).
 */
const THEME_COLOR = { light: '#0e7f8f', dark: '#14162b' } as const

type ThemeState = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

/**
 * Tema escolhido (Claro / Escuro / Sistema), salvo no aparelho. Formato antigo mantido: `theme` guarda
 * "light" ou "dark" em texto puro, e "Sistema" apaga a chave.
 */
const useThemeStore = create<ThemeState>()(
  persist((set) => ({ mode: 'system', setMode: (mode) => set({ mode }) }), {
    name: STORAGE_KEY,
    partialize: ({ mode }) => ({ mode }),
    storage: legacyStorage<{ mode: ThemeMode }>({
      parse: (text) => (text === 'light' || text === 'dark' ? { mode: text } : undefined),
      serialize: ({ mode }) => (mode === 'system' ? null : mode),
    }),
  }),
)

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function apply(mode: ThemeMode) {
  const theme = resolve(mode)
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

// Aplica o tema em qualquer página (não só com o seletor aberto) e acompanha o sistema em "Sistema".
if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.matchMedia) {
  apply(useThemeStore.getState().mode)
  useThemeStore.subscribe((state, previous) => {
    if (state.mode !== previous.mode) apply(state.mode)
  })
  window.matchMedia(DARK_QUERY).addEventListener('change', () => {
    if (useThemeStore.getState().mode === 'system') apply('system')
  })
}

export function useTheme() {
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)
  return { mode, setMode }
}
