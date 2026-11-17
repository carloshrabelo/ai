import { GENRES, type Genre, genreSlug } from './genres'

/** Nome do parâmetro na URL: ?genres=salsa,west-coast-swing */
export const GENRES_PARAM = 'genres'

/** Texto livre → forma de slug: caixa baixa, sem acento, espaços e "_" viram "-". */
export function normalizeSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

const BY_SLUG = new Map(GENRES.map((genre) => [genreSlug(genre), genre]))

/**
 * Valor cru do parâmetro → gêneros válidos, sem repetição, na ordem de GENRES.
 * Cada item é normalizado (caixa baixa, sem acento); o que não bate com nenhum gênero é descartado.
 */
export function parseGenresParam(raw: string | null): Genre[] {
  if (!raw) return []
  const found = new Set(
    raw
      .split(',')
      .map((part) => BY_SLUG.get(normalizeSlug(part)))
      .filter((genre): genre is Genre => !!genre),
  )
  return GENRES.filter((genre) => found.has(genre))
}

/** Gêneros → valor canônico do parâmetro ('' quando vazio). */
export function genresToParam(genres: readonly Genre[]): string {
  return GENRES.filter((genre) => genres.includes(genre)).map(genreSlug).join(',')
}

/**
 * Search params com `genres` na forma canônica, ou null se já estão canônicos.
 * Parâmetro vazio (ou só com valores inválidos) é removido.
 */
export function canonicalGenresSearch(params: URLSearchParams): URLSearchParams | null {
  const all = params.getAll(GENRES_PARAM)
  if (all.length === 0) return null

  const canonical = genresToParam(parseGenresParam(all.join(',')))
  if (canonical && all.length === 1 && all[0] === canonical) return null

  const next = new URLSearchParams(params)
  next.delete(GENRES_PARAM)
  if (canonical) next.set(GENRES_PARAM, canonical)
  return next
}

/** Evento passa no filtro? Filtro vazio = tudo; senão, basta ter um dos gêneros (acumulativo). */
export function matchesGenres(eventGenres: readonly Genre[], selected: readonly Genre[]): boolean {
  return selected.length === 0 || eventGenres.some((genre) => selected.includes(genre))
}

/** "?a=1&genres=salsa,zouk" com vírgulas legíveis (URLSearchParams codifica como %2C). */
export function toSearchString(params: URLSearchParams): string {
  const search = params.toString().replace(/%2C/gi, ',')
  return search ? `?${search}` : ''
}
