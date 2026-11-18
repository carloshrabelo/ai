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

  it('trechos a mais entram no nome; o preço é o último', () => {
    expect(parseSummary('Forró • Forró do Coreto • Despedida Camila Alves • 12€ ou 17€ ou 17€ ou 20€')).toMatchObject({
      title: 'Forró do Coreto • Despedida Camila Alves',
      price: '12€ ou 17€ ou 17€ ou 20€',
    })
  })

  it('último trecho que não parece preço é parte do nome', () => {
    const parsed = parseSummary('Forró • No Mercado • Turmalina Parahyba Forró Festa')
    expect(parsed.title).toBe('No Mercado • Turmalina Parahyba Forró Festa')
    expect(parsed.price).toBeUndefined()
  })

  it.each(['Pago', 'Paid', 'Free', 'Contribuição Voluntaria', 'Doaçao', 'Pago (5€?)', '5€ ou Gratuito'])('reconhece preço sem valor: %s', (price) => {
    expect(parseSummary(`Salsa • Noite • ${price}`).price).toBe(price)
  })

  it('tag sem gênero conhecido mantém rawTag', () => {
    expect(parseSummary('Fusão • The Fusion Social • 5€')).toMatchObject({ genres: [], rawTag: 'Fusão' })
  })

  it('sem separador, tudo é título', () => {
    expect(parseSummary('Baile de verão')).toEqual({ genres: [], rawTag: '', title: 'Baile de verão' })
  })

  it.each([
    ['(Cancelado) Bachata • Noite X', 'cancelled'],
    ['[Cancelled] Latinas • Noite X', 'cancelled'],
    ['(Cancelada) Afro-Latinas • Noite X', 'cancelled'],
    ['(CANCELADO) Forró • Noite X', 'cancelled'],
    ['(Cancrlado) Swing • Noite X', 'cancelled'],
    ['[Postponed] Bachata • Noite X', 'postponed'],
    ['(Adiado) Salsa • Noite X', 'postponed'],
  ])('%s → %s, sem o prefixo', (summary, status) => {
    const parsed = parseSummary(summary)
    expect(parsed.status).toBe(status)
    expect(parsed.rawTag).not.toMatch(/[[(]/)
    expect(parsed.genres.length).toBeGreaterThan(0)
    expect(parsed.title).toBe('Noite X')
  })

  it('sem prefixo, sem status', () => {
    expect(parseSummary('Salsa • Noite').status).toBeUndefined()
  })

  it('summary vazio ou ausente', () => {
    expect(parseSummary(undefined).title).toBe('Sem título')
    expect(parseSummary('   ').title).toBe('Sem título')
  })
})
