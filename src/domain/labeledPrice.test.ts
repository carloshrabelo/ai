import { describe, expect, it } from 'vitest'
import { labeledPrice } from './labeledPrice'

describe('labeledPrice', () => {
  it.each([
    ['5€', { kind: 'single', options: [{ amount: 5 }] }],
    [
      '€5 for members / €10 for non-members',
      {
        kind: 'alternatives',
        options: [
          { amount: 5, label: 'members' },
          { amount: 10, label: 'nonMembers' },
        ],
      },
    ],
    ['5€ / 3€ for students of LeT', { kind: 'alternatives', options: [{ amount: 5 }, { amount: 3, label: 'students', labelArg: 'LeT' }] }],
    ['10€ (8€ bebida incluída)', { kind: 'alternatives', options: [{ amount: 10 }, { amount: 8, label: 'drink', detail: true }] }],
    ['20€ ou 15€ (alunos)', { kind: 'alternatives', options: [{ amount: 20 }, { amount: 15, label: 'students' }] }],
    ['7€ ou 9€ (porta)', { kind: 'alternatives', options: [{ amount: 7 }, { amount: 9, label: 'door' }] }],
    [
      '10€ até 01h após 12€',
      {
        kind: 'alternatives',
        options: [
          { amount: 10, label: 'until', labelArg: '1' },
          { amount: 12, label: 'after' },
        ],
      },
    ],
    ['5€ to 15€ (flexible)', { kind: 'range', options: [{ amount: 5 }, { amount: 15 }], flexible: true }],
    ['5€ ou Gratuito', { kind: 'alternatives', options: [{ amount: 5 }, { free: true }] }],
    ['10€ com bebida', { kind: 'single', options: [{ amount: 10, label: 'withDrink' }] }],
    ['10€ (consumo mínimo)', { kind: 'single', options: [{ amount: 10, label: 'minimum' }] }],
    ['15€ | 20€', { kind: 'alternatives', options: [{ amount: 15 }, { amount: 20 }] }],
    ['7,50€ ou 10€', { kind: 'alternatives', options: [{ amount: 7.5 }, { amount: 10 }] }],
    ['Pago (5€?)', { kind: 'single', options: [{ text: 'Pago' }], note: '5€?' }],
  ])('%s', (raw, expected) => {
    expect(labeledPrice(raw)).toEqual(expected)
  })
})
