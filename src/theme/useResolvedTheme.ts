import { useSyncExternalStore } from 'react'

/** Tema aplicado agora ("light" | "dark"), lido de <html data-theme>. Atualiza quando o tema muda. */
export function useResolvedTheme(): 'light' | 'dark' {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
      return () => observer.disconnect()
    },
    () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'),
  )
}
