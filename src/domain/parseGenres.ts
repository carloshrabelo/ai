import { ALIAS, GENRES, type Genre } from './genres'

const byLengthDesc = (a: string, b: string) => b.length - a.length

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Casa o termo inteiro: sem letra ou número colado antes ou depois. */
const wholeTerm = (term: string) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(term)}(?![\\p{L}\\p{N}])`, 'gu')

// Do mais longo para o mais curto: AFRO-LATINAS antes de AFRO, SBKZ antes de SBK,
// WEST COAST SWING antes de SWING.
const ALIAS_RULES = Object.keys(ALIAS)
  .sort(byLengthDesc)
  .map((key) => ({ pattern: wholeTerm(key), replacement: ` ${ALIAS[key]} ` }))

const GENRE_RULES = [...GENRES]
  .sort(byLengthDesc)
  .map((genre) => ({ genre, pattern: wholeTerm(genre.toUpperCase()) }))

/**
 * Tag do evento (1º trecho do summary) → gêneros de GENRES, na ordem de GENRES.
 * West Coast Swing e Swing são gêneros diferentes: um nunca implica o outro.
 */
export function parseGenres(tag: string): Genre[] {
  let text = tag.normalize('NFC').toUpperCase().trim()

  for (const { pattern, replacement } of ALIAS_RULES) {
    text = text.replace(pattern, replacement)
  }

  const found = new Set<Genre>()
  for (const { genre, pattern } of GENRE_RULES) {
    if (text.match(pattern)) {
      found.add(genre)
      text = text.replace(pattern, ' ')
    }
  }

  return GENRES.filter((genre) => found.has(genre))
}

/** Gêneros que não são procurados em texto corrido (genéricos demais). */
const NOT_IN_TEXT = new Set<Genre>(['Latinas', 'Afro']) // "músicas latinas", "afro house"

/**
 * Gêneros citados pelo nome num texto livre (título, descrição). Sem aliases: siglas como "SBK"
 * ou "AFRO" em texto corrido dariam falsos positivos ("afro house").
 * Mesma regra de nome inteiro e do mais longo para o mais curto (West Coast Swing ≠ Swing).
 */
export function genresInText(text: string): Genre[] {
  let upper = text.normalize('NFC').toUpperCase()
  const found = new Set<Genre>()
  for (const { genre, pattern } of GENRE_RULES) {
    if (upper.match(pattern)) {
      if (!NOT_IN_TEXT.has(genre)) found.add(genre)
      upper = upper.replace(pattern, ' ')
    }
  }
  return GENRES.filter((genre) => found.has(genre))
}
