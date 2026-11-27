import { describe, expect, it } from 'vitest'
import { ALIAS } from './genres'
import { genresInText, genresInTitleWords, parseGenres } from './parseGenres'

describe('parseGenres', () => {
  it.each([
    ['Kizomba', ['Kizomba']],
    ['Salsa', ['Salsa']],
    ['Bachata', ['Bachata']],
    ['Forró', ['Forró']],
    ['Swing', ['Swing']],
    ['Salsa & Bachata', ['Salsa', 'Bachata']],
    ['Latinas', ['Latinas']],
    ['Latinas & Bachata', ['Bachata', 'Latinas']],
    ['Salsa Cubana', ['Salsa Cubana']],
    ['Cuban Salsa', ['Salsa Cubana']],
    ['Merengue', ['Merengue']],
    ['Bachata & Merengue', ['Bachata', 'Merengue']],
    ['Blues', ['Blues']],
    ['Swing & Blues', ['Swing', 'Blues']],
    ['Balboa', ['Balboa']],
    ['Shag', ['Shag']],
    ['Lindy Hop', ['Swing']],
  ])('%s → gêneros diretos', (tag, expected) => {
    expect(parseGenres(tag)).toEqual(expected)
  })

  describe('ALIAS', () => {
    it.each([
      ['Afro-Latinas', ['Latinas', 'Afro']],
      ['Afro', ['Afro']],
      ['Pista Latinas', ['Latinas']],
      ['Pista Africana', ['Afro']],
      ['Africanas', ['Afro']],
      ['Afro-Latino', ['Latinas', 'Afro']],
      ['Urban Kiz', ['Urban Kiz']],
      ['UrbanKiz', ['Urban Kiz']],
      ["Latinas & Africanas & Rock n' Roll", ['Latinas', 'Afro']],
      ['SBKZ', ['Zouk', 'Salsa', 'Bachata', 'Kizomba']],
      ['SBK', ['Salsa', 'Bachata', 'Kizomba']],
      ['WCS', ['West Coast Swing']],
      ['West Coas Swing', ['West Coast Swing']],
      ['Samba de Gafieira & Vários', ['Samba']],
      ['Samba de Gafieira', ['Samba']],
      ['Forro', ['Forró']],
      ['Lindy Hop', ['Swing']],
    ])('%s → %j', (tag, expected) => {
      expect(parseGenres(tag)).toEqual(expected)
    })

    it.each(Object.keys(ALIAS).filter((key) => ALIAS[key] === ''))('%s é descartado', (tag) => {
      expect(parseGenres(tag)).toEqual([])
    })
  })

  describe('ordem do mais longo para o mais curto', () => {
    it('AFRO-LATINAS não é tratado como AFRO', () => {
      expect(parseGenres('AFRO-LATINAS')).toContain('Latinas')
    })

    it('SBKZ não é tratado como SBK', () => {
      expect(parseGenres('SBKZ')).toContain('Zouk')
    })

    it('West Coast Swing nunca gera Swing', () => {
      expect(parseGenres('West Coast Swing')).toEqual(['West Coast Swing'])
      expect(parseGenres('WCS')).not.toContain('Swing')
    })

    it('Swing e West Coast Swing juntos geram os dois', () => {
      expect(parseGenres('Swing & WCS')).toEqual(['Swing', 'West Coast Swing'])
    })

    it('Swingado não é Swing', () => {
      expect(parseGenres('Swingado')).toEqual([])
    })
  })

  it('ignora maiúsculas/minúsculas e acentos compostos', () => {
    expect(parseGenres('kIzOmBa')).toEqual(['Kizomba'])
    expect(parseGenres('Forró'.normalize('NFD'))).toEqual(['Forró'])
  })

  it('remove duplicados e devolve na ordem de GENRES', () => {
    expect(parseGenres('Bachata & SBK & Salsa')).toEqual(['Salsa', 'Bachata', 'Kizomba'])
  })

  it('Urban Kiz não vira Kizomba (é gênero próprio do conjunto Afro)', () => {
    expect(parseGenres('Urban Kiz')).not.toContain('Kizomba')
  })

  it.each(['Vários', 'Fusão', ''])('%j → nenhum gênero', (tag) => {
    expect(parseGenres(tag)).toEqual([])
  })
})

describe('genresInTitleWords', () => {
  it.each([
    ['Salsaviva Festa_', ['Salsa']],
    ['Milonga TangoLX ed. 2027', ['Tango']],
    ['Vitrola Forrozeira', ['Forró']],
    ['Bachatazo de Verão', ['Bachata']],
    ['ZOUKANDO', ['Zouk']],
  ] as const)('%j → %j', (title, genres) => {
    expect(genresInTitleWords(title)).toEqual(genres)
  })

  it.each([
    'Salsa no Parque', // palavra igual ao estilo: fica com genresInText
    'Latinidades', // conjuntos (Latinas, Afro, BR) não contam colados
    'Afrobeat Night',
    'Brasileirinho',
    'Westie Fest',
    'Noite Africana',
  ])('%j → nenhum', (title) => {
    expect(genresInTitleWords(title)).toEqual([])
  })
})

describe('genresInText ignora links', () => {
  it('o slug de um link não vira estilo', () => {
    expect(genresInText('Evento: https://facebook.com/events/s/baile-folk-com-folky-balboa/1174 Baile Folk')).toEqual([])
    expect(genresInText('Mais em www.example.com/salsa-night e Bachata na pista')).toEqual(['Bachata'])
  })
})

describe('famílias American e Salão', () => {
  it('não são procuradas em texto corrido ("Salão Lua", "American bar"); os estilos delas, sim', () => {
    expect(genresInText('Baile no Salão Lua, com Tango e Blues no American bar')).toEqual(['Blues', 'Tango'])
  })
})
