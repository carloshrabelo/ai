export const GENRES = [
  'Zouk',
  'Forró',
  'Salsa',
  'Salsa Cubana',
  'Bachata',
  'Merengue',
  'Latinas',
  'Kizomba',
  'Semba',
  'Urban Kiz',
  'Afro',
  'Swing',
  'Tango',
  'West Coast Swing',
  'Bolero',
  'Samba',
  'BR',
] as const

export type Genre = (typeof GENRES)[number]

/**
 * Chave = texto da tag (maiúsculas). Valor = gêneros separados por espaço; '' = descartar o texto.
 * Os valores não podem ser divididos por espaço: "WEST COAST SWING" é um gênero só.
 */
export const ALIAS: Record<string, string> = {
  'QUEEN KIZOMBA PROJECT': '',
  'RODA DE SAMBA?': '',
  'AFRO-LATINAS': 'LATINAS AFRO',
  'AFRO-LATINOS': 'LATINAS AFRO',
  'AFRO-LATINO': 'LATINAS AFRO',
  AFRICANAS: 'AFRO',
  AFRICANA: 'AFRO',
  URBANKIZ: 'URBAN KIZ',
  'CUBAN SALSA': 'SALSA CUBANA',
  AFRO: 'AFRO',
  'PISTA LATINAS': 'LATINAS',
  'PISTA AFRICANA': 'AFRO',
  SBKZ: 'SALSA BACHATA KIZOMBA ZOUK',
  SBK: 'SALSA BACHATA KIZOMBA',
  WCS: 'WEST COAST SWING',
  'WEST COAS SWING': 'WEST COAST SWING', // erro de digitação no calendário
  'ZOUK✅': '',
  'SAMBA DE GAFIEIRA & VÁRIOS': 'SAMBA',
  'SAMBA DE GAFIEIRA': 'SAMBA',
  FORRO: 'FORRÓ',
  SWINGADO: '',
  SHAG: 'SWING',
}

export type GenreColor =
  | 'wine'
  | 'pink'
  | 'brown'
  | 'dark-blue'
  | 'red'
  | 'yellow'
  | 'dark-green'
  | 'light-blue'
  | 'orange'
  | 'purple'
  | 'teal'
  | 'coral'
  | 'lime'
  | 'indigo'
  | 'emerald'
  | 'cyan'
  | 'rose'

export const genreToPalette: Record<Genre, GenreColor> = {
  Bachata: 'wine',
  Bolero: 'pink',
  Forró: 'brown',
  Kizomba: 'dark-blue',
  Salsa: 'red',
  Samba: 'yellow',
  Semba: 'dark-green',
  Swing: 'light-blue',
  Tango: 'orange',
  Zouk: 'purple',
  'West Coast Swing': 'teal',
  Latinas: 'coral',
  Afro: 'lime',
  Merengue: 'indigo',
  BR: 'emerald',
  'Urban Kiz': 'cyan',
  'Salsa Cubana': 'rose',
}

/**
 * Gêneros "guarda-chuva": o evento aparece também no filtro dos gêneros incluídos
 * (Latinas → Salsa, Salsa Cubana, Bachata e Merengue; Afro → Kizomba, Semba e Urban Kiz; BR → Forró, Zouk e Samba).
 */
export const GENRE_INCLUDES: Partial<Record<Genre, readonly Genre[]>> = {
  Latinas: ['Salsa', 'Salsa Cubana', 'Bachata', 'Merengue'],
  Afro: ['Kizomba', 'Semba', 'Urban Kiz'],
  BR: ['Forró', 'Zouk', 'Samba'],
}

/** Bandeira de cada conjunto, exibida antes do nome no chip. */
export const GENRE_EMOJI: Partial<Record<Genre, string>> = {
  Latinas: '🇩🇴', // República Dominicana
  Afro: '🇦🇴', // Angola
  BR: '🇧🇷', // Brasil
}

/** Conjuntos para os filtros: o gênero "guarda-chuva" e os gêneros dele. */
export const GENRE_GROUPS = Object.entries(GENRE_INCLUDES).map(([umbrella, genres]) => ({
  umbrella: umbrella as Genre,
  genres: genres as readonly Genre[],
}))

/** O gênero é um conjunto (Latinas, Afro, BR)? */
export const isUmbrella = (genre: Genre) => !!GENRE_INCLUDES[genre]

/**
 * Gêneros para exibir nas tags. Um gênero "guarda-chuva" fica oculto quando algum dos gêneros
 * que ele inclui já aparece: "Latinas" só é exibida se nem Salsa, nem Bachata, nem Merengue foram informadas;
 * "Afro", se nem Kizomba, nem Semba, nem Urban Kiz.
 * (Os filtros continuam usando todos os gêneros do evento.)
 */
export function visibleGenres(genres: readonly Genre[]): Genre[] {
  return genres.filter(
    (genre) =>
      !GENRE_INCLUDES[genre]?.some((included) => genres.includes(included)) &&
      // Com a variação presente, o gênero "pai" não se repete: Salsa Cubana no lugar de Salsa.
      !genres.some((other) => GENRE_PARENT[other] === genre),
  )
}

/**
 * Palavras que confirmam um gênero "guarda-chuva" no título/descrição, além dos próprios
 * subgêneros. Usado para tags compostas como "Afro-Latinas" (ver confirmedUmbrellas).
 */
const UMBRELLA_EVIDENCE: Partial<Record<Genre, RegExp>> = {
  Latinas: /(?<![\p{L}\p{N}])latin(?:a|as|o|os)?(?![\p{L}\p{N}])/iu,
  Afro: /(?<![\p{L}\p{N}])(?:afro|africana|africanas|african)(?![\p{L}\p{N}])/iu,
  BR: /(?<![\p{L}\p{N}])(?:br|brasil|brazil|brasileir[ao]s?|brazilian)(?![\p{L}\p{N}])/iu,
}

/**
 * Tag composta (vários gêneros "guarda-chuva", ex.: "Afro-Latinas" → Latinas + Afro): mantém só
 * as partes que o título ou a descrição confirmam (pelo nome ou por um subgênero citado).
 * Se nenhuma parte é confirmada, mantém todas, para não perder a informação da tag.
 *
 * @param tagGenres gêneros vindos da tag
 * @param textGenres gêneros citados no título/descrição
 * @param text título + descrição em texto puro
 */
export function confirmedUmbrellas(tagGenres: readonly Genre[], textGenres: readonly Genre[], text: string): Genre[] {
  const umbrellas = tagGenres.filter((genre) => GENRE_INCLUDES[genre])
  if (umbrellas.length < 2) return [...tagGenres]
  const confirmed = umbrellas.filter(
    (umbrella) =>
      UMBRELLA_EVIDENCE[umbrella]?.test(text) || GENRE_INCLUDES[umbrella]?.some((genre) => textGenres.includes(genre)),
  )
  if (confirmed.length === 0) return [...tagGenres]
  return tagGenres.filter((genre) => !umbrellas.includes(genre) || confirmed.includes(genre))
}

/**
 * Variações de um gênero: evento de Salsa Cubana também é de Salsa (aparece no filtro "Salsa"),
 * mas evento de Salsa não é de Salsa Cubana.
 */
export const GENRE_PARENT: Partial<Record<Genre, Genre>> = {
  'Salsa Cubana': 'Salsa',
}

/** Gêneros do evento + os incluídos por eles + os "pais" das variações (para filtrar). */
export function expandGenres(genres: readonly Genre[]): Set<Genre> {
  const withParents = genres.flatMap((genre) => [genre, ...(GENRE_PARENT[genre] ? [GENRE_PARENT[genre]] : [])])
  return new Set(withParents.flatMap((genre) => [genre, ...(GENRE_INCLUDES[genre] ?? [])]))
}

/** Slug para URL (?genres=west-coast-swing,forro). */
export function genreSlug(genre: Genre): string {
  return genre
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
}

export function genreFromSlug(slug: string): Genre | undefined {
  return GENRES.find((genre) => genreSlug(genre) === slug)
}
