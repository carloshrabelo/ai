import { describe, expect, it } from 'vitest'
import { priceFromDescription } from './descriptionPrice'

describe('priceFromDescription', () => {
  it.each([
    '🎟️ Entrada Grátis',
    '𝐏𝐫𝐢𝐜𝐞: Free!',
    'Entrada Livre ',
    '💸FREE ENTRY',
    'Local: Cais do Sodré\nEntrada gratuita\nTraz os amigos',
    'Free entrance for everyone',
    'Preço: grátis',
    'Entrada livre para todos',
    'Free entry for everyone!',
    'FREE TO ATTEND.',
    '🎟️ FREE COMMUNITY EVENT',
    '🎟️ FREE COMMUNITY',
  ])('entrada gratuita: %s', (text) => {
    expect(priceFromDescription(text)).toBe('Gratuito')
  })

  it.each([
    'Free entry until 23h, then 5€',
    'Entrada grátis até às 22h',
    'Entrada grátis para sócios',
    'Free class before the party',
    'Free to attend until 22h',
    'Entrada 5€',
    'Dança livre a noite toda',
    '',
  ])('não é gratuito: %s', (text) => {
    expect(priceFromDescription(text)).toBeUndefined()
  })

  it.each([
    ['💵 12€ | 10€ para alunos Swing n’ Smile', '12€ | 10€'],
    ['(1 class: 15€ | 2 classes: 20€)', '15€ | 20€'],
    ['Aula<br>💵 12€ | 10€ para alunos<br>Entrada grátis', '12€ | 10€'],
    ['<p>Preços</p><p>€8 | €10</p>', '8€ | 10€'],
  ])('tabela de valores: %s', (text, price) => {
    expect(priceFromDescription(text)).toBe(price)
  })

  it.each(['Aula 10€ | Festa', 'Rua X | Lisboa', '10€ ou 12€ | 5€ e 7€'])('não é tabela de valores: %s', (text) => {
    expect(priceFromDescription(text)).toBeUndefined()
  })
})
