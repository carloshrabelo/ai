import { describe, expect, it } from 'vitest'
import {
  canonicalGenresSearch,
  coveringUmbrella,
  genresToParam,
  groupState,
  umbrellaState,
  matchesGenres,
  normalizeSlug,
  parseGenresParam,
  toggleFilter,
} from './genreFilter'

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

  it('"Latinas" aparece no filtro de Salsa, de Bachata, de Merengue e no próprio', () => {
    expect(matchesGenres(['Latinas'], ['Salsa'])).toBe(true)
    expect(matchesGenres(['Latinas'], ['Bachata'])).toBe(true)
    expect(matchesGenres(['Latinas'], ['Latinas'])).toBe(true)
    expect(matchesGenres(['Latinas'], ['Merengue'])).toBe(true)
    expect(matchesGenres(['Latinas'], ['Kizomba'])).toBe(false)
  })

  it('Salsa Cubana aparece no filtro de Salsa e de Latinas; Salsa não aparece no de Salsa Cubana', () => {
    expect(matchesGenres(['Salsa Cubana'], ['Salsa'])).toBe(true)
    expect(matchesGenres(['Salsa Cubana'], ['Latinas'])).toBe(true)
    expect(matchesGenres(['Salsa Cubana'], ['Salsa Cubana'])).toBe(true)
    expect(matchesGenres(['Salsa'], ['Salsa Cubana'])).toBe(false)
  })

  it('evento "Latinas" não aparece no filtro Salsa Cubana (só nos de Salsa, Bachata, Merengue)', () => {
    expect(matchesGenres(['Latinas'], ['Salsa Cubana'])).toBe(false)
    expect(matchesGenres(['Latinas', 'Afro'], ['Salsa Cubana'])).toBe(false)
    expect(matchesGenres(['Latinas'], ['Salsa'])).toBe(true)
  })

  it('American (Swing, Blues, West Coast Swing) e Salão (Tango, Bolero)', () => {
    expect(matchesGenres(['Blues'], ['American'])).toBe(true)
    expect(matchesGenres(['West Coast Swing'], ['American'])).toBe(true)
    expect(matchesGenres(['American'], ['Swing'])).toBe(true)
    expect(matchesGenres(['Tango'], ['Salão'])).toBe(true)
    expect(matchesGenres(['Bolero'], ['Salão'])).toBe(true)
    expect(matchesGenres(['Tango'], ['American'])).toBe(false)
    expect(parseGenresParam('american,salao')).toEqual(['American', 'Salão'])
    // Shag e Balboa: variações do Swing (filtro Swing e American), sem o caminho inverso
    expect(matchesGenres(['Balboa'], ['Swing'])).toBe(true)
    expect(matchesGenres(['Shag'], ['American'])).toBe(true)
    expect(matchesGenres(['Swing'], ['Balboa'])).toBe(false)
  })

  it('Urban Kiz faz parte de Afro', () => {
    expect(matchesGenres(['Urban Kiz'], ['Afro'])).toBe(true)
    expect(matchesGenres(['Afro'], ['Urban Kiz'])).toBe(true)
    expect(matchesGenres(['Urban Kiz'], ['Kizomba'])).toBe(false)
  })

  it('"Afro" aparece no filtro de Kizomba e de Semba', () => {
    expect(matchesGenres(['Afro'], ['Kizomba'])).toBe(true)
    expect(matchesGenres(['Afro'], ['Semba'])).toBe(true)
    expect(matchesGenres(['Afro'], ['Salsa'])).toBe(false)
  })

  it('Latinas não inclui Afro (nem Kizomba/Semba)', () => {
    expect(matchesGenres(['Latinas'], ['Afro'])).toBe(false)
    expect(matchesGenres(['Kizomba'], ['Latinas'])).toBe(false)
    expect(matchesGenres(['Latinas'], ['Kizomba'])).toBe(false)
  })

  it('Afro-Latinas (Latinas + Afro) aparece nos filtros dos dois grupos', () => {
    for (const filter of ['Latinas', 'Salsa', 'Bachata', 'Merengue', 'Afro', 'Kizomba', 'Semba'] as const) {
      expect(matchesGenres(['Latinas', 'Afro'], [filter])).toBe(true)
    }
    expect(matchesGenres(['Latinas', 'Afro'], ['Forró'])).toBe(false)
  })

  it('filtro de conjunto pega o grupo todo ("Latinas" traz eventos só de Salsa)', () => {
    expect(matchesGenres(['Salsa'], ['Latinas'])).toBe(true)
    expect(matchesGenres(['Merengue'], ['Latinas'])).toBe(true)
    expect(matchesGenres(['Kizomba'], ['Latinas'])).toBe(false)
    expect(matchesGenres(['Forró'], ['BR'])).toBe(true)
    expect(matchesGenres(['Zouk'], ['BR'])).toBe(true)
    expect(matchesGenres(['Swing'], ['BR'])).toBe(false)
  })

  it('evento sem gênero some quando há filtro', () => {
    expect(matchesGenres([], ['Salsa'])).toBe(false)
  })
})

describe('conjunto marcado inclui os estilos dele', () => {
  it('marcar o conjunto tira os estilos dele já marcados; os de outros conjuntos ficam', () => {
    expect(toggleFilter(['Salsa', 'Bachata', 'Kizomba'], 'Latinas')).toEqual(['Kizomba', 'Latinas'])
  })

  it('estilo incluído num conjunto marcado aparece marcado', () => {
    expect(coveringUmbrella('Salsa Cubana', ['Latinas'])).toBe('Latinas')
    expect(coveringUmbrella('Kizomba', ['Latinas'])).toBeUndefined()
  })

  it('desmarcar um estilo de um conjunto marcado: o conjunto sai e os outros estilos ficam (intermediário)', () => {
    const next = toggleFilter(['Latinas', 'Kizomba'], 'Bachata')
    expect(next).toEqual(['Kizomba', 'Salsa', 'Salsa Cubana', 'Merengue'])
    expect(umbrellaState('Latinas', next)).toBe('mixed')
    expect(umbrellaState('Afro', next)).toBe('mixed')
    expect(umbrellaState('BR', next)).toBe(false)
  })

  it('conjunto intermediário: clicar marca o grupo todo; marcado: desmarca o grupo todo', () => {
    expect(toggleFilter(['Salsa', 'Kizomba'], 'Latinas')).toEqual(['Kizomba', 'Latinas'])
    expect(toggleFilter(['Latinas', 'Kizomba'], 'Latinas')).toEqual(['Kizomba'])
  })

  it('marcar o último estilo que faltava volta a marcar o conjunto', () => {
    expect(toggleFilter(['Salsa', 'Salsa Cubana', 'Merengue'], 'Bachata')).toEqual(['Latinas'])
    expect(umbrellaState('Latinas', ['Latinas'])).toBe(true)
  })

  it('desmarcar o conjunto libera os estilos', () => {
    expect(toggleFilter(['Latinas'], 'Latinas')).toEqual([])
    expect(toggleFilter([], 'Salsa')).toEqual(['Salsa'])
  })

  it('link antigo "latinas,salsa" vira só Latinas', () => {
    expect(parseGenresParam('latinas,salsa,kizomba')).toEqual(['Latinas', 'Kizomba'])
    expect(genresToParam(['Salsa', 'Latinas'])).toBe('latinas')
  })

  it('todos os estilos de um conjunto na URL viram o conjunto', () => {
    expect(parseGenresParam('salsa,salsa-cubana,bachata,merengue,zouk')).toEqual(['Zouk', 'Latinas'])
    expect(genresToParam(['Salsa', 'Salsa Cubana', 'Bachata', 'Merengue'])).toBe('latinas')
  })
})

describe('groupState', () => {
  it('nenhum, parte ou todos marcados', () => {
    expect(groupState(['Swing', 'Tango'], [])).toBe(false)
    expect(groupState(['Swing', 'Tango'], ['Tango', 'Salsa'])).toBe('mixed')
    expect(groupState(['Swing', 'Tango'], ['Swing', 'Tango'])).toBe(true)
  })
})
