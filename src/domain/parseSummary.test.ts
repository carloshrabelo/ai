import { describe, expect, it } from 'vitest'
import { parseSummary } from './parseSummary'

describe('parseSummary', () => {
  it('separa tag, título e preço', () => {
    expect(parseSummary('SBK • Festa na Aerlis • 7€ (4€ Sócios)')).toEqual({
      genres: ['Salsa', 'Bachata', 'Kizomba'],
      rawTag: 'SBK',
      title: 'Festa na Aerlis',
      price: '7€ (4€ Sócios)',
    })
  })

  it('preço é opcional', () => {
    expect(parseSummary('Kizomba • Kizomba na Rua')).toEqual({
      genres: ['Kizomba'],
      rawTag: 'Kizomba',
      title: 'Kizomba na Rua',
    })
  })

  it('mantém aspas e separadores extras no preço', () => {
    const parsed = parseSummary('Swing • Street Jazz Concert " Tuba Skinny" & "The Invisible Tuba" • 13€ ou 17€ ou 20€')
    expect(parsed.title).toBe('Street Jazz Concert " Tuba Skinny" & "The Invisible Tuba"')
    expect(parsed.price).toBe('13€ ou 17€ ou 20€')
  })

  it('tag sem gênero conhecido mantém rawTag', () => {
    expect(parseSummary('Fusão • The Fusion Social • 5€')).toMatchObject({ genres: [], rawTag: 'Fusão' })
  })

  it('sem separador, tudo é título', () => {
    expect(parseSummary('Baile de verão')).toEqual({ genres: [], rawTag: '', title: 'Baile de verão' })
  })

  it('summary vazio ou ausente', () => {
    expect(parseSummary(undefined).title).toBe('Sem título')
    expect(parseSummary('   ').title).toBe('Sem título')
  })
})
