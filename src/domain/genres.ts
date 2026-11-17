export const GENRES = [
  'Zouk',
  'Forró',
  'Salsa',
  'Bachata',
  'Latinas',
  'Kizomba',
  'Semba',
  'Afro',
  'Swing',
  'Tango',
  'West Coast Swing',
  'Bolero',
  'Samba',
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
}

/**
 * Gêneros "guarda-chuva": o evento aparece também no filtro dos gêneros incluídos
 * (Latinas → Salsa e Bachata; Afro → Kizomba e Semba).
 */
export const GENRE_INCLUDES: Partial<Record<Genre, readonly Genre[]>> = {
  Latinas: ['Salsa', 'Bachata'],
  Afro: ['Kizomba', 'Semba'],
}

/**
 * Gêneros para exibir nas tags. Um gênero "guarda-chuva" fica oculto quando algum dos gêneros
 * que ele inclui já aparece: "Latinas" só é exibida se nem Salsa nem Bachata foram informadas;
 * "Afro", se nem Kizomba nem Semba.
 * (Os filtros continuam usando todos os gêneros do evento.)
 */
export function visibleGenres(genres: readonly Genre[]): Genre[] {
  return genres.filter((genre) => !GENRE_INCLUDES[genre]?.some((included) => genres.includes(included)))
}

/** Gêneros do evento + os incluídos por eles (para filtrar). */
export function expandGenres(genres: readonly Genre[]): Set<Genre> {
  return new Set(genres.flatMap((genre) => [genre, ...(GENRE_INCLUDES[genre] ?? [])]))
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
