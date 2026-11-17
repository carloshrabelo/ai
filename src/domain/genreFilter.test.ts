import { describe, expect, it } from 'vitest'
import { canonicalGenresSearch, genresToParam, matchesGenres, normalizeSlug, parseGenresParam } from './genreFilter'

describe('normalizeSlug', () => {
  it.each([
    ['Forró', 'forro'],
    ['FORRÓ', 'forro'],
    ['West Coast Swing', 'west-coast-swing'],
    ['  west_coast  swing ', 'west-coast-swing'],
    ['Sálsa', 'salsa'],
  ])('%j → %j', (input, expected) => {
    expect(normalizeSlug(input)).toBe(expected)
  })
})

describe('parseGenresParam', () => {
  it('aceita caixa alta, acento e espaços', () => {
    expect(parseGenresParam('SALSA,Forró,West Coast Swing')).toEqual(['Forró', 'Salsa', 'West Coast Swing'])
  })

  it('descarta o que não bate depois de normalizar', () => {
    expect(parseGenresParam('salsa,funk,,  ,kizomba')).toEqual(['Salsa', 'Kizomba'])
  })

  it('remove repetidos e ordena como GENRES', () => {
    expect(parseGenresParam('kizomba,salsa,KIZOMBA')).toEqual(['Salsa', 'Kizomba'])
  })

  it('vazio ou ausente', () => {
    expect(parseGenresParam(null)).toEqual([])
    expect(parseGenresParam('')).toEqual([])
  })
})

describe('Outros', () => {
  it('aceita "outros" na URL, em qualquer caixa, e fica por último', () => {
    expect(parseGenresParam('OUTROS,salsa')).toEqual(['Salsa', 'Outros'])
    expect(genresToParam(['Outros', 'Salsa'])).toBe('salsa,outros')
  })

  it('só "Outros": eventos sem gênero da lista', () => {
    expect(matchesGenres([], ['Outros'])).toBe(true)
    expect(matchesGenres(['Salsa'], ['Outros'])).toBe(false)
  })

  it('acumulativo com gêneros', () => {
    expect(matchesGenres([], ['Salsa', 'Outros'])).toBe(true)
    expect(matchesGenres(['Salsa'], ['Salsa', 'Outros'])).toBe(true)
    expect(matchesGenres(['Kizomba'], ['Salsa', 'Outros'])).toBe(false)
  })
})

describe('genresToParam', () => {
  it('slugs em caixa baixa, sem acento, na ordem de GENRES', () => {
    expect(genresToParam(['West Coast Swing', 'Forró', 'Salsa'])).toBe('forro,salsa,west-coast-swing')
  })
})

describe('canonicalGenresSearch', () => {
  const canon = (search: string) => canonicalGenresSearch(new URLSearchParams(search))?.toString() ?? null

  it('já canônico → null (não redireciona)', () => {
    expect(canon('genres=salsa,kizomba&date=2026-07-10')).toBeNull()
    expect(canon('date=2026-07-10')).toBeNull()
  })

  it('normaliza e mantém os outros parâmetros', () => {
    expect(canon('date=2026-07-10&genres=Forr%C3%B3,SALSA')).toBe('date=2026-07-10&genres=forro%2Csalsa')
  })

  it('remove inválidos', () => {
    expect(canon('genres=salsa,funk')).toBe('genres=salsa')
  })

  it('remove o parâmetro quando nada sobra', () => {
    expect(canon('genres=funk&date=2026-07-10')).toBe('date=2026-07-10')
    expect(canon('genres=')).toBe('')
  })

  it('junta parâmetros repetidos', () => {
    expect(canon('genres=salsa&genres=zouk')).toBe('genres=zouk%2Csalsa')
  })
})

describe('matchesGenres', () => {
  it('filtro vazio mostra tudo, inclusive sem gênero', () => {
    expect(matchesGenres([], [])).toBe(true)
  })

  it('acumulativo: basta ter um dos selecionados', () => {
    expect(matchesGenres(['Salsa', 'Bachata'], ['Bachata', 'Zouk'])).toBe(true)
    expect(matchesGenres(['Kizomba'], ['Bachata', 'Zouk'])).toBe(false)
  })

  it('evento sem gênero some quando há filtro', () => {
    expect(matchesGenres([], ['Salsa'])).toBe(false)
  })
})
