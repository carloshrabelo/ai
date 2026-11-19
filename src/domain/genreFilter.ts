import { expandGenres, GENRE_GROUPS, GENRE_INCLUDES, GENRES, type Genre, genreSlug } from './genres'

/** Nome do parâmetro na URL: ?genres=salsa,west-coast-swing,outros */
export const GENRES_PARAM = 'genres'

/** Opção do filtro para eventos cujo gênero não está em GENRES (Fusão, Vários…). */
export const OTHER_GENRES = 'Outros'

/** Um valor do filtro: um gênero da lista ou "Outros". */
export type GenreFilterValue = Genre | typeof OTHER_GENRES

/** Ordem das opções no filtro e na URL: os gêneros e, por último, "Outros". */
export const FILTER_VALUES: readonly GenreFilterValue[] = [...GENRES, OTHER_GENRES]

/** Slug na URL: "west-coast-swing", "forro", "outros". */
function filterSlug(value: GenreFilterValue): string {
  return value === OTHER_GENRES ? 'outros' : genreSlug(value)
}

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

/** Estilo → conjunto que o inclui (Salsa, Salsa Cubana → Latinas). */
const UMBRELLA_OF = new Map<GenreFilterValue, Genre>(
  GENRE_GROUPS.flatMap(({ umbrella, genres }) => genres.map((genre) => [genre, umbrella] as const)),
)

/**
 * Conjunto marcado que já inclui este estilo, se houver. Com "Latinas" marcada, Salsa, Bachata etc.
 * aparecem marcados e bloqueados no filtro: o conjunto já traz o grupo todo.
 */
export function coveringUmbrella(value: GenreFilterValue, selected: readonly GenreFilterValue[]): Genre | undefined {
  const umbrella = UMBRELLA_OF.get(value)
  return umbrella && selected.includes(umbrella) ? umbrella : undefined
}

/** Tira os estilos já incluídos num conjunto marcado ("latinas,salsa" → "latinas"). */
function withoutCovered(values: readonly GenreFilterValue[]): GenreFilterValue[] {
  return values.filter((value) => !coveringUmbrella(value, values))
}

/**
 * Marca ou desmarca uma opção. Marcar um conjunto tira os estilos dele que estavam marcados
 * (redundantes); estilo incluído num conjunto marcado não muda (fica bloqueado).
 */
/** Estado da caixa de um grupo: todos marcados, parte (mixed) ou nenhum. */
export function groupState(values: readonly GenreFilterValue[], selected: readonly GenreFilterValue[]): boolean | 'mixed' {
  const count = values.filter((value) => selected.includes(value)).length
  return count === 0 ? false : count === values.length ? true : 'mixed'
}

export function toggleFilter(selected: readonly GenreFilterValue[], value: GenreFilterValue): GenreFilterValue[] {
  if (coveringUmbrella(value, selected)) return [...selected]
  return selected.includes(value) ? selected.filter((item) => item !== value) : withoutCovered([...selected, value])
}

const BY_SLUG = new Map(FILTER_VALUES.map((value) => [filterSlug(value), value]))

/**
 * Valor cru do parâmetro → opções válidas, sem repetição, na ordem de FILTER_VALUES.
 * Cada item é normalizado (caixa baixa, sem acento); o que não bate com nenhuma opção é descartado,
 * e estilos incluídos num conjunto também marcado saem ("latinas,salsa" → Latinas).
 */
export function parseGenresParam(raw: string | null): GenreFilterValue[] {
  if (!raw) return []
  const found = new Set(
    raw
      .split(',')
      .map((part) => BY_SLUG.get(normalizeSlug(part)))
      .filter((value): value is GenreFilterValue => !!value),
  )
  return withoutCovered(FILTER_VALUES.filter((value) => found.has(value)))
}

/** Opções → valor canônico do parâmetro ('' quando vazio). */
export function genresToParam(values: readonly GenreFilterValue[]): string {
  return withoutCovered(FILTER_VALUES.filter((value) => values.includes(value)))
    .map(filterSlug)
    .join(',')
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

/**
 * Evento passa no filtro? Filtro vazio = tudo; senão, basta ter um dos gêneros marcados
 * (acumulativo). "Outros" pega os eventos sem gênero da lista.
 */
export function matchesGenres(eventGenres: readonly Genre[], selected: readonly GenreFilterValue[]): boolean {
  if (selected.length === 0) return true
  if (eventGenres.length === 0) return selected.includes(OTHER_GENRES)
  // Evento "Latinas" passa no filtro de Salsa, Bachata e Merengue; e o filtro de um conjunto
  // ("Latinas") pega o grupo todo: eventos com a tag do conjunto ou com qualquer gênero dele.
  const expanded = expandGenres(eventGenres)
  return selected.some(
    (value) => value !== OTHER_GENRES && (expanded.has(value) || (GENRE_INCLUDES[value]?.some((g) => expanded.has(g)) ?? false)),
  )
}

/** "?a=1&genres=salsa,zouk" com vírgulas legíveis (URLSearchParams codifica como %2C). */
export function toSearchString(params: URLSearchParams): string {
  const search = params.toString().replace(/%2C/gi, ',')
  return search ? `?${search}` : ''
}
