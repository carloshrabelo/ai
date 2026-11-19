import { useCallback, useState } from 'react'
import { readJson, writeJson } from '../lib/storage'

/**
 * useState salvo no aparelho (localStorage, em JSON). Sem storage, funciona como um useState comum.
 * `isValid` descarta o que estiver salvo num formato antigo ou errado.
 */
export function usePersistentState<T>(key: string, fallback: T, isValid?: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(() => readJson(key, fallback, isValid))
  const update = useCallback(
    (next: T) => {
      setValue(next)
      writeJson(key, next)
    },
    [key],
  )
  return [value, update] as const
}
