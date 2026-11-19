// localStorage que nunca derruba o app: em aba anônima com bloqueio, cota cheia ou fora do navegador,
// a leitura devolve o padrão e a escrita é ignorada (a preferência vale só nesta sessão).

/** O localStorage, se puder ser usado; senão undefined. */
export function safeStorage(): Storage | undefined {
  try {
    const key = '__storage_test__'
    window.localStorage.setItem(key, key)
    window.localStorage.removeItem(key)
    return window.localStorage
  } catch {
    return undefined
  }
}

/** Texto salvo na chave, ou null. */
export function readText(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

/** Salva o texto; null apaga a chave. */
export function writeText(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // sem storage
  }
}

/** JSON salvo na chave; o padrão se não houver, não for JSON ou não passar em `isValid`. */
export function readJson<T>(key: string, fallback: T, isValid: (value: unknown) => value is T = (value): value is T => value !== null): T {
  const text = readText(key)
  if (text === null) return fallback
  try {
    const value: unknown = JSON.parse(text)
    return isValid(value) ? value : fallback
  } catch {
    return fallback
  }
}

export const writeJson = (key: string, value: unknown) => writeText(key, JSON.stringify(value))
