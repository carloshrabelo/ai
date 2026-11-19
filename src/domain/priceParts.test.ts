import { describe, expect, it } from 'vitest'
import { priceParts } from './priceParts'

describe('priceParts', () => {
  it.each([
    ['5€', { kind: 'single', options: ['5€'], min: 5, max: 5 }],
    ['5€ ou 10€', { kind: 'alternatives', options: ['5€', '10€'], min: 5, max: 10 }],
    ['12€ ou 17€ ou 20€', { kind: 'alternatives', options: ['12€', '17€', '20€'], min: 12, max: 20 }],
    ['5€ ou Gratuito', { kind: 'alternatives', options: ['5€', 'Gratuito'], min: 0, max: 5 }],
    ['5€ a 15€ (flexível)', { kind: 'range', options: ['5€', '15€'], min: 5, max: 15, note: '(flexível)' }],
    ['5€ ou 3€ para alunos de LeT', { kind: 'alternatives', options: ['5€', '3€'], min: 3, max: 5, note: 'para alunos de LeT' }],
    ['10€ (8€ bebida incluída)', { kind: 'single', options: ['10€'], min: 10, max: 10, note: '(8€ bebida incluída)' }],
    ['10€ até 1h após 12€', { kind: 'single', options: ['10€'], min: 10, max: 10, note: 'até 1h após 12€' }],
    ['7,50€', { kind: 'single', options: ['7,50€'], min: 7.5, max: 7.5 }],
    ['Gratuito', { kind: 'single', options: ['Gratuito'], min: 0, max: 0 }],
    ['Pago (5€?)', { kind: 'single', options: ['Pago'], note: '(5€?)' }],
    ['Contribuição voluntária', { kind: 'single', options: ['Contribuição voluntária'] }],
    ['Sócios grátis', { kind: 'text', options: ['Sócios grátis'] }],
  ])('%s', (text, parts) => {
    expect(priceParts(text)).toEqual(parts)
  })
})
