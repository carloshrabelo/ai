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

/** Conjunto → estilos dele na tela de filtros (Latinas → Salsa, Salsa Cubana, Bachata, Merengue). */
const MEMBERS_OF = new Map<GenreFilterValue, readonly Genre[]>(GENRE_GROUPS.map(({ umbrella, genres }) => [umbrella, genres]))

/** Conjunto marcado que já inclui este estilo, se houver (com "Latinas" marcada, Salsa aparece marcada). */
export function coveringUmbrella(value: GenreFilterValue, selected: readonly GenreFilterValue[]): Genre | undefined {
  const umbrella = UMBRELLA_OF.get(value)
  return umbrella && selected.includes(umbrella) ? umbrella : undefined
}

/**
 * Forma canônica: estilos já incluídos num conjunto marcado saem ("latinas,salsa" → Latinas), e um
 * conjunto com todos os estilos marcados vira o próprio conjunto (Salsa + Salsa Cubana + Bachata +
 * Merengue → Latinas). Os dois filtram os mesmos eventos: o estilo pega também os eventos marcados só
 * com o conjunto.
 */
function canonical(values: readonly GenreFilterValue[]): GenreFilterValue[] {
  let result = values.filter((value) => !coveringUmbrella(value, values))
  for (const [umbrella, members] of MEMBERS_OF) {
    if (members.every((member) => result.includes(member)))
      result = [...result.filter((value) => !members.includes(value as Genre)), umbrella]
  }
  return result
}

/** Estado da caixa de um grupo: todos marcados, parte (mixed) ou nenhum. */
export function groupState(values: readonly GenreFilterValue[], selected: readonly GenreFilterValue[]): boolean | 'mixed' {
  const count = values.filter((value) => selected.includes(value)).length
  return count === 0 ? false : count === values.length ? true : 'mixed'
}

/**
 * Caixa de um conjunto: marcada com o conjunto no filtro; "mixed" (intermediária) quando só parte dos
 * estilos dele está marcada — aí o conjunto em si não está no filtro, só os estilos.
 */
export function umbrellaState(umbrella: Genre, selected: readonly GenreFilterValue[]): boolean | 'mixed' {
  if (selected.includes(umbrella)) return true
  return groupState(MEMBERS_OF.get(umbrella) ?? [], selected)
}

/**
 * Marca ou desmarca uma opção.
 * - Conjunto: desmarcado ou intermediário → marca o grupo todo (só o conjunto fica no filtro);
 *   marcado → desmarca o grupo todo.
 * - Estilo de um conjunto marcado: o conjunto sai do filtro e os outros estilos dele ficam marcados
 *   (a caixa do conjunto passa a intermediária). Nada fica bloqueado.
 * - Marcar o último estilo que faltava num conjunto volta a marcar o conjunto.
 */
export function toggleFilter(selected: readonly GenreFilterValue[], value: GenreFilterValue): GenreFilterValue[] {
  const members = MEMBERS_OF.get(value)
  if (members) {
    const rest = selected.filter((item) => item !== value && !members.includes(item as Genre))
    return selected.includes(value) ? rest : [...rest, value]
  }
  const umbrella = coveringUmbrella(value, selected)
  if (umbrella) {
    return [...selected.filter((item) => item !== umbrella), ...(MEMBERS_OF.get(umbrella) ?? []).filter((member) => member !== value)]
  }
  return canonical(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
}

const BY_SLUG = new Map(FILTER_VALUES.map((value) => [filterSlug(value), value]))

/**
 * Valor cru do parâmetro → opções válidas, sem repetição, na ordem de FILTER_VALUES.
 * Cada item é normalizado (caixa baixa, sem acento); o que não bate com nenhuma opção é descartado,
 * na forma canônica ("latinas,salsa" → Latinas; todos os estilos de um conjunto → o conjunto).
 */
export function parseGenresParam(raw: string | null): GenreFilterValue[] {
  if (!raw) return []
  const found = new Set(
    raw
      .split(',')
      .map((part) => BY_SLUG.get(normalizeSlug(part)))
      .filter((value): value is GenreFilterValue => !!value),
  )
  const values = canonical(FILTER_VALUES.filter((value) => found.has(value)))
  return FILTER_VALUES.filter((value) => values.includes(value))
}

/** Opções → valor canônico do parâmetro ('' quando vazio). */
export function genresToParam(values: readonly GenreFilterValue[]): string {
  const result = canonical(values)
  return FILTER_VALUES.filter((value) => result.includes(value))
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
