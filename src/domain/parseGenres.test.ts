import { describe, expect, it } from 'vitest'
import { ALIAS } from './genres'
import { parseGenres } from './parseGenres'

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
    ['Salsa Cubana', ['Salsa']],
    ['Merengue', ['Merengue']],
    ['Bachata & Merengue', ['Bachata', 'Merengue']],
  ])('%s → gêneros diretos', (tag, expected) => {
    expect(parseGenres(tag)).toEqual(expected)
  })

  describe('ALIAS', () => {
    it.each([
      ['Afro-Latinas', ['Latinas', 'Afro']],
      ['Afro', ['Afro']],
      ['Pista Latinas', ['Latinas']],
      ['Pista Africana', ['Afro']],
      ['SBKZ', ['Zouk', 'Salsa', 'Bachata', 'Kizomba']],
      ['SBK', ['Salsa', 'Bachata', 'Kizomba']],
      ['WCS', ['West Coast Swing']],
      ['West Coas Swing', ['West Coast Swing']],
      ['Samba de Gafieira & Vários', ['Samba']],
      ['Samba de Gafieira', ['Samba']],
      ['Forro', ['Forró']],
      ['Shag', ['Swing']],
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

  it.each(['Vários', 'Fusão', ''])('%j → nenhum gênero', (tag) => {
    expect(parseGenres(tag)).toEqual([])
  })
})
