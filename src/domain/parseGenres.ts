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

const GENRE_RULES = [...GENRES].sort(byLengthDesc).map((genre) => ({ genre, pattern: wholeTerm(genre.toUpperCase()) }))

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
const NOT_IN_TEXT = new Set<Genre>(['Latinas', 'Afro', 'BR', 'Tradicionais']) // "músicas latinas", "afro house", "BR-116", "doces tradicionais"

/**
 * Gêneros citados pelo nome num texto livre (título, descrição). Sem aliases: siglas como "SBK"
 * ou "AFRO" em texto corrido dariam falsos positivos ("afro house").
 * Mesma regra de nome inteiro e do mais longo para o mais curto (West Coast Swing ≠ Swing).
 */
export function genresInText(text: string): Genre[] {
  // Outras grafias: "UrbanKiz" → "URBAN KIZ", "Cuban Salsa" → "SALSA CUBANA".
  let upper = text
    .normalize('NFC')
    .toUpperCase()
    .replace(/(?<![\p{L}\p{N}])URBANKIZ(?![\p{L}\p{N}])/gu, 'URBAN KIZ')
    .replace(/(?<![\p{L}\p{N}])CUBAN\s+SALSA(?![\p{L}\p{N}])/gu, 'SALSA CUBANA')
  const found = new Set<Genre>()
  for (const { genre, pattern } of GENRE_RULES) {
    if (upper.match(pattern)) {
      if (!NOT_IN_TEXT.has(genre)) found.add(genre)
      upper = upper.replace(pattern, ' ')
    }
  }
  return GENRES.filter((genre) => found.has(genre))
}

/** Sem acento e em maiúsculas: "Forrozeira" e "Forró" comparam como FORROZEIRA e FORRO. */
const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()

/**
 * Estilos de uma palavra só que podem aparecer colados no começo de outra palavra no título. Os
 * conjuntos (Latinas, Afro…) ficam de fora pelo mesmo motivo de NOT_IN_TEXT, e os de várias palavras
 * (West Coast Swing, Salsa Cubana, Urban Kiz) não fazem sentido colados.
 */
const PREFIX_GENRES = GENRES.filter((genre) => !genre.includes(' ') && !NOT_IN_TEXT.has(genre))
  .sort(byLengthDesc)
  .map((genre) => ({ genre, prefix: plain(genre) }))

/**
 * Estilos no começo de uma palavra mais longa do título, como nome de festa ou de grupo: "Salsaviva"
 * → Salsa, "Milonga TangoLX" → Tango, "Forrozeira" → Forró, "Bachatazo" → Bachata. Só no título: na
 * descrição, links e @perfis dariam falsos positivos. A palavra igual ao estilo fica com genresInText.
 */
export function genresInTitleWords(title: string): Genre[] {
  const found = new Set<Genre>()
  for (const word of plain(title).match(/[\p{L}\p{N}]+/gu) ?? []) {
    const match = PREFIX_GENRES.find(({ prefix }) => word.length > prefix.length && word.startsWith(prefix))
    if (match) found.add(match.genre)
  }
  return GENRES.filter((genre) => found.has(genre))
}
