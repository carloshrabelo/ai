import type { Genre } from './genres'
import { parseGenres } from './parseGenres'

/** Situação marcada no título: "(Cancelado) …", "[Cancelled] …", "[Postponed] …". */
export type EventStatus = 'cancelled' | 'postponed'

export type ParsedSummary = {
  status?: EventStatus
  genres: Genre[]
  /** Texto original da tag, para exibir quando genres = []. '' quando não há tag. */
  rawTag: string
  title: string
  price?: string
}

const SEPARATOR = /\s+•\s+/

// Prefixo de situação, com variações e erros de digitação vistos no calendário
// ("Cancelado", "Cancelada", "CANCELADO", "Cancrlado", "Cancelled", "Postponed", "Adiado").
const STATUS_PREFIX = /^\s*[([]\s*(canc\w*|postponed|adiad[oa])\s*[)\]]\s*/i

function readStatus(summary: string): { status?: EventStatus; rest: string } {
  const match = summary.match(STATUS_PREFIX)
  if (!match) return { rest: summary }
  const status: EventStatus = /^canc/i.test(match[1]) ? 'cancelled' : 'postponed'
  return { status, rest: summary.slice(match[0].length) }
}

/**
 * "Tag • Nome • Preço" → partes. O preço é opcional; sem " • ", tudo é título.
 * Um prefixo de situação ("(Cancelado)", "[Postponed]") vira `status` e sai do texto.
 */
export function parseSummary(summary: string | undefined): ParsedSummary {
  const { status, rest: text } = readStatus(summary ?? '')
  const withStatus = status ? { status } : {}
  const parts = text
    .split(SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length < 2) {
    return { ...withStatus, genres: [], rawTag: '', title: parts[0] ?? 'Sem título' }
  }

  const [rawTag, ...rest] = parts
  const price = rest.length > 1 ? rest.slice(1).join(' • ') : undefined

  return {
    ...withStatus,
    genres: parseGenres(rawTag),
    rawTag,
    title: rest[0],
    ...(price ? { price } : {}),
  }
}
