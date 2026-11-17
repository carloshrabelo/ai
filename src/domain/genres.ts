export const GENRES = [
  'Zouk',
  'Forró',
  'Salsa',
  'Bachata',
  'Kizomba',
  'Semba',
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
  'AFRO-LATINAS': 'SALSA BACHATA KIZOMBA SEMBA',
  AFRO: 'KIZOMBA SEMBA',
  'PISTA LATINAS': 'SALSA BACHATA',
  'PISTA AFRICANA': 'KIZOMBA SEMBA',
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
