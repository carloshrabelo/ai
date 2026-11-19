import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { checkSpelling, type SpellLanguage } from '../../api/languageTool'
import type { ToolMatch } from '../../domain/spelling'

/** Línguas verificadas: só conta como erro a palavra que todas marcam (ver domain/spelling.ts). */
const LANGUAGES: SpellLanguage[] = ['pt-PT', 'pt-BR', 'en-US', 'es']

/**
 * Ortografia dos textos pelo LanguageTool, em cada língua, com o progresso (textos × línguas já
 * verificados). Só busca com `enabled`; o resultado fica no cache da sessão.
 */
export function useSpellcheck(texts: string[], enabled: boolean) {
  const [progress, setProgress] = useState(0)
  const query = useQuery({
    queryKey: ['review-spelling', texts],
    queryFn: async ({ signal }) => {
      setProgress(0)
      // Respostas das línguas para cada texto, na ordem de LANGUAGES.
      const results = new Map<string, ToolMatch[][]>(texts.map((text) => [text, []]))
      for (const [i, language] of LANGUAGES.entries()) {
        const checked = await checkSpelling(texts, language, { signal, onProgress: (done) => setProgress(i * texts.length + done) })
        texts.forEach((text, j) => results.get(text)?.push(checked[j]))
      }
      return results
    },
    enabled: enabled && texts.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
  const total = texts.length * LANGUAGES.length
  return { ...query, progress: Math.min(progress, total), total }
}
