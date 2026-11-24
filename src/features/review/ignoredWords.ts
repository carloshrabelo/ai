import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { jsonCodec, legacyStorage } from '../../lib/persistStorage'

const STORAGE_KEY = 'lisbon-social-dance:review-ignored'
const isWordList = (value: unknown): value is string[] => Array.isArray(value) && value.every((word) => typeof word === 'string')
const json = jsonCodec(isWordList)

type IgnoredWordsState = {
  words: string[]
  setWords: (words: string[]) => void
}

/**
 * Palavras ignoradas na revisão (/review), salvas no aparelho de quem revisa. Formato antigo mantido:
 * a chave guarda o array de palavras em JSON, sem envelope.
 */
export const useIgnoredWords = create<IgnoredWordsState>()(
  persist((set) => ({ words: [], setWords: (words) => set({ words }) }), {
    name: STORAGE_KEY,
    partialize: ({ words }) => ({ words }),
    storage: legacyStorage<{ words: string[] }>({
      parse: (text) => {
        const words = json.parse(text)
        return words && { words }
      },
      serialize: ({ words }) => json.serialize(words),
    }),
  }),
)
