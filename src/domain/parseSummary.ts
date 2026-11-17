import type { Genre } from './genres'
import { parseGenres } from './parseGenres'

export type ParsedSummary = {
  genres: Genre[]
  /** Texto original da tag, para exibir quando genres = []. '' quando não há tag. */
  rawTag: string
  title: string
  price?: string
}

const SEPARATOR = /\s+•\s+/

/** "Tag • Nome • Preço" → partes. O preço é opcional; sem " • ", tudo é título. */
export function parseSummary(summary: string | undefined): ParsedSummary {
  const parts = (summary ?? '')
    .split(SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length < 2) {
    return { genres: [], rawTag: '', title: parts[0] ?? 'Sem título' }
  }

  const [rawTag, ...rest] = parts
  const price = rest.length > 1 ? rest.slice(1).join(' • ') : undefined

  return {
    genres: parseGenres(rawTag),
    rawTag,
    title: rest[0],
    ...(price ? { price } : {}),
  }
}
