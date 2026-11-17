import { describe, expect, it } from 'vitest'
import { detectLocale } from './locale'
import { MESSAGES } from './messages'

describe('detectLocale', () => {
  it.each([
    [['pt-BR'], 'pt-BR'],
    [['pt-PT', 'en'], 'pt-BR'],
    [['pt'], 'pt-BR'],
    [['en-GB'], 'en-US'],
    [['fr-FR', 'pt-PT'], 'pt-BR'], // primeiro idioma suportado na ordem do usuário
    [['fr-FR', 'en-US', 'pt-BR'], 'en-US'],
    [['de-DE', 'es-ES'], 'en-US'], // nenhum suportado: reserva
    [[], 'en-US'],
  ])('%j → %s', (languages, expected) => {
    expect(detectLocale(languages)).toBe(expected)
  })
})

describe('MESSAGES', () => {
  // Mesmas chaves nos dois idiomas (o tipo já garante; aqui pegamos textos vazios).
  const keys = (value: unknown, prefix = ''): string[] =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.entries(value).flatMap(([key, child]) => keys(child, `${prefix}${key}.`))
      : [prefix]

  it('pt-BR e en-US têm as mesmas chaves', () => {
    expect(keys(MESSAGES['en-US'])).toEqual(keys(MESSAGES['pt-BR']))
  })

  it('plurais', () => {
    expect(MESSAGES['pt-BR'].map.count(1)).toBe('1 evento')
    expect(MESSAGES['pt-BR'].map.count(3)).toBe('3 eventos')
    expect(MESSAGES['en-US'].map.count(1)).toBe('1 event')
    expect(MESSAGES['en-US'].map.count(3)).toBe('3 events')
    expect(MESSAGES['pt-BR'].filters.active(2)).toBe('2 ativos')
  })
})
