import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

/** Mesma chave lida pelo script inline do index.html (evita piscar no carregamento). */
const STORAGE_KEY = 'theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Cor da barra do navegador/PWA em cada tema (igual ao header). */
const THEME_COLOR = { light: '#0e7f8f', dark: '#14162b' } as const

function readMode(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function apply(mode: ThemeMode) {
  const theme = resolve(mode)
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(readMode)

  useEffect(() => {
    apply(mode)
    if (mode !== 'system') return
    const media = window.matchMedia(DARK_QUERY)
    const onChange = () => apply('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  const setMode = useCallback((next: ThemeMode) => {
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Sem storage (aba anônima, bloqueado): o tema vale só nesta sessão.
    }
    setModeState(next)
  }, [])

  return { mode, setMode }
}
