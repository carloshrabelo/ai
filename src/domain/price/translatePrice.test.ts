import { describe, expect, it } from 'vitest'
import { normalizePrice, translatePrice } from './translatePrice'

// Preços reais do calendário (ver /teste/precos).
const CASES: [raw: string, pt: string, en: string][] = [
  ['Pago', 'Pago', 'Paid'],
  ['pago', 'Pago', 'Paid'],
  ['Paid', 'Pago', 'Paid'],
  ['Free', 'Gratuito', 'Free'],
  ['Contribuição Voluntaria', 'Contribuição voluntária', 'Donation'],
  ['Contribuição Voluntária', 'Contribuição voluntária', 'Donation'],
  ['Doaçao', 'Contribuição voluntária', 'Donation'],
  ['3€', '3€', '€3'],
  ['7€ ou 10€', '7€ ou 10€', '€7 or €10'],
  ['5€ ou 7€ ou 10€', '5€ ou 7€ ou 10€', '€5 or €7 or €10'],
  ['8€ou 10€', '8€ ou 10€', '€8 or €10'],
  ['5€ ou Gratuito', '5€ ou Gratuito', '€5 or Free'],
  ['10€ até 1h após 12€ (8€ bebida incluída)', '10€ até 1h após 12€ (8€ bebida incluída)', '€10 until 1am, then €12 (€8 drink included)'],
  ['10€ até 01h após 12€', '10€ até 1h após 12€', '€10 until 1am, then €12'],
  ['10€ (8€ bebida incluíds)', '10€ (8€ bebida incluída)', '€10 (€8 drink included)'],
  ['10€ (8€ bebidas incluído)', '10€ (8€ bebida incluída)', '€10 (€8 drink included)'],
  ['8€ (1 bebida incluída)', '8€ (1 bebida incluída)', '€8 (1 drink included)'],
  ['10€ (consumo mínimo)', '10€ (consumo mínimo)', '€10 (minimum spend)'],
  ['10€ (Acesso à Fábrica)', '10€ (Acesso à Fábrica)', '€10 (access to Fábrica)'],
  ['20€ ou 15€ (alunos)', '20€ ou 15€ (alunos)', '€20 or €15 (students)'],
  ['7€ ou 9€ (porta)', '7€ ou 9€ (porta)', '€7 or €9 (at the door)'],
  ['Pago (5€?)', 'Pago (5€?)', 'Paid (€5?)'],
  ['10€ com bebida', '10€ com bebida', '€10 with a drink'],
  // Em inglês (calendário de tango).
  ['€5 for members / €10 for non-members', '5€ ou 10€', '€5 or €10'],
  ['5€ to 15€ (flexible)', '5€ a 15€ (flexível)', '€5 to €15 (flexible)'],
  ['5€ / 3€ for students of LeT', '5€ ou 3€ para alunos de LeT', '€5 or €3 for students of LeT'],
  ['€12 or €17 or €20', '12€ ou 17€ ou 20€', '€12 or €17 or €20'],
  // Tabela de valores lida da descrição ("1 class: 15€ | 2 classes: 20€").
  ['15€ | 20€', '15€ ou 20€', '€15 or €20'],
]

describe('translatePrice', () => {
  it.each(CASES)('%s', (raw, pt, en) => {
    expect(normalizePrice(raw)).toBe(pt)
    expect(translatePrice(raw, 'pt-BR')).toBe(pt)
    expect(translatePrice(raw, 'en-US')).toBe(en)
  })

  it('não mexe em palavras que só contêm os termos', () => {
    expect(translatePrice('Turmalina Parahyba Forró Festa', 'en-US')).toBe('Turmalina Parahyba Forró Festa')
    expect(translatePrice('Ouro', 'en-US')).toBe('Ouro')
  })
})
