// Preço do calendário (texto cru, em português ou inglês) → valores com o rótulo de cada um, para
// exibir em chips: "€5 for members / €10 for non-members" → [5€ sócios, 10€ não sócios];
// "10€ (8€ bebida incluída)" → [10€, 8€ bebida incluída]; "5€ / 3€ for students of LeT" →
// [5€, 3€ alunos LeT]. Diferente do normalizePrice, não descarta as qualificações.

/** Rótulos conhecidos (traduzidos na exibição). */
export type PriceLabel = 'members' | 'nonMembers' | 'students' | 'door' | 'drink' | 'withDrink' | 'minimum' | 'until' | 'after'

export type PriceOption = {
  /** Valor em euros; ausente em opção sem valor ("Gratuito", "Pago"). */
  amount?: number
  free?: boolean
  /** Texto da opção sem valor ("Pago", "Contribuição voluntária"). */
  text?: string
  label?: PriceLabel
  /** Complemento do rótulo: hora de "até 1h", escola de "alunos LeT". */
  labelArg?: string
  /** Qualificação não reconhecida, como veio. */
  rawLabel?: string
  /**
   * Detalhe do valor anterior, não uma opção à parte: veio entre parênteses
   * ("10€ (8€ bebida incluída)": o 8€ explica os 10€). Na exibição, fica junto dele.
   */
  detail?: true
  /** Valor com "?" ("Pago (5€?)": não confirmado). */
  uncertain?: true
}

export type LabeledPrice = {
  kind: 'single' | 'alternatives' | 'range'
  options: PriceOption[]
  flexible?: boolean
  /** Parênteses que não se aplicam a um valor. */
  note?: string
}

const AMOUNT = String.raw`\d+(?:[.,]\d+)?€`
const toNumber = (amount: string) => Number(amount.replace('€', '').replace(',', '.'))

/** Qualificação → rótulo conhecido (ou o texto como veio). */
function classify(text: string): Pick<PriceOption, 'label' | 'labelArg' | 'rawLabel'> {
  const rest = text.trim()
  if (!rest) return {}
  if (/non-?members|n[aã]o s[oó]cios/i.test(rest)) return { label: 'nonMembers' }
  if (/members|s[oó]cios/i.test(rest)) return { label: 'members' }
  const students = rest.match(/(?:for |para )?(?:students|alunos)(?:\s+(?:of|de|do|da))?\s*(.*)$/i)
  if (students) return { label: 'students', ...(students[1] ? { labelArg: students[1].trim() } : {}) }
  if (/porta|door/i.test(rest)) return { label: 'door' }
  if (/com bebida|with a drink|gets you/i.test(rest)) return { label: 'withDrink' }
  if (/bebidas? inclu|drinks? included/i.test(rest)) return { label: 'drink' }
  if (/consumo m[ií]nimo|minimum/i.test(rest)) return { label: 'minimum' }
  return { rawLabel: rest }
}

function option(segment: string): PriceOption {
  const text = segment.trim()
  const match = text.match(new RegExp(`^(${AMOUNT})\\s*(.*)$`, 'u'))
  if (match) return { amount: toNumber(match[1]), ...classify(match[2]) }
  if (/^(gr[aá]tis|gratuito|free)$/i.test(text)) return { free: true }
  return { text }
}

export function labeledPrice(raw: string): LabeledPrice {
  let text = raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/€\s*(\d+(?:[.,]\d+)?)/g, '$1€')
    .replace(/(\d)\s+€/g, '$1€')

  // "10€ até 01h após 12€": 10€ até a 1h, 12€ depois.
  const until = text.match(new RegExp(`^(${AMOUNT}) até 0?(\\d{1,2})h após (${AMOUNT})\\s*(.*)$`, 'iu'))
  if (until) {
    const rest = until[4].replace(/^\(|\)$/g, '').trim()
    return {
      kind: 'alternatives',
      options: [
        { amount: toNumber(until[1]), label: 'until', labelArg: until[2] },
        { amount: toNumber(until[3]), label: 'after' },
      ],
      ...(rest ? { note: rest } : {}),
    }
  }

  // Parênteses no fim: "(flexible)", "(alunos)", "(8€ bebida incluída)".
  let paren: string | undefined
  const withParen = text.match(/^(.*?)\s*\(([^)]*)\)\s*$/)
  if (withParen) {
    text = withParen[1]
    paren = withParen[2].trim()
  }
  const flexible = !!paren && /^flex/i.test(paren)
  if (flexible) paren = undefined

  const range = text.match(new RegExp(`^(${AMOUNT}) (?:to|a|-|–) (${AMOUNT})$`, 'iu'))
  const options = range
    ? [{ amount: toNumber(range[1]) }, { amount: toNumber(range[2]) }]
    : text
        .split(/\s*(?:\/|\||\bou\b|\bor\b)\s*/i)
        .filter(Boolean)
        .map(option)

  let note: string | undefined
  if (paren) {
    const amountInParen = paren.match(new RegExp(`^(${AMOUNT})\\s*(.*)$`, 'u'))
    const last = options.at(-1)
    if (amountInParen) {
      // Valor entre parênteses é detalhe do anterior: "10€ (8€ bebida incluída)", "Pago (5€?)".
      const rest = amountInParen[2].trim()
      options.push({
        amount: toNumber(amountInParen[1]),
        ...(rest === '?' ? { uncertain: true } : classify(rest)),
        detail: true,
      })
    } else if (!amountInParen && last && !last.label && !last.rawLabel && last.amount !== undefined) {
      Object.assign(last, classify(paren))
    } else note = paren
  }

  return {
    kind: options.length === 1 ? 'single' : range ? 'range' : 'alternatives',
    options,
    ...(flexible ? { flexible } : {}),
    ...(note ? { note } : {}),
  }
}
