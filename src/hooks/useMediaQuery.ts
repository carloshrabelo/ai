import { useCallback, useSyncExternalStore } from 'react'

/** true enquanto a media query casa. Ex.: useMediaQuery('(min-width: 80rem)') para `xl`. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

/** Breakpoint `xl` do Tailwind (1280px): sidebar e coluna do mapa. */
export const XL_QUERY = '(min-width: 80rem)'
