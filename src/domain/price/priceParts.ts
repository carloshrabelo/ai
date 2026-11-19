// Partes de um preço já padronizado em português (ver normalizePrice em src/domain/price/translatePrice.ts), para
// exibir de outros jeitos: "5€ ou 10€" → alternativas [5€, 10€]; "5€ a 15€ (flexível)" → faixa de 5
// a 15 com a observação "(flexível)"; "10€ (8€ bebida incluída)" → valor único com observação.

type PriceKind = 'single' | 'alternatives' | 'range' | 'text'

export type PriceParts = {
  kind: PriceKind
  /** Cada opção como está no texto padronizado: "5€", "Gratuito". */
  options: string[]
  /** Menor e maior valor em euros (Gratuito conta como 0); sem valor, undefined. */
  min?: number
  max?: number
  /** O resto: parênteses e qualificações ("(flexível)", "para alunos de LeT", "até 1h após 12€"). */
  note?: string
}

const AMOUNT = String.raw`\d+(?:[.,]\d+)?€`
const WORD = 'Gratuito|Pago|Contribuição voluntária'
const OPTION = `(?:${AMOUNT}|${WORD})`
// Opções no começo do texto, ligadas por "ou" (alternativas) ou "a" (faixa); o resto é observação.
const LEADING = new RegExp(`^(${OPTION}(?: (?:ou|a) ${OPTION})*)(.*)$`, 'u')

const valueOf = (option: string): number | undefined =>
  option === 'Gratuito' ? 0 : /^\d/.test(option) ? Number(option.replace('€', '').replace(',', '.')) : undefined

export function priceParts(normalized: string): PriceParts {
  const match = normalized.trim().match(LEADING)
  if (!match) return { kind: 'text', options: [normalized.trim()] }

  const [, main, rest] = match
  const isRange = / a /.test(main)
  const options = main.split(/ (?:ou|a) /)
  const values = options.map(valueOf).filter((value): value is number => value !== undefined)
  const note = rest.trim()
  return {
    kind: options.length === 1 ? 'single' : isRange ? 'range' : 'alternatives',
    options,
    ...(values.length > 0 ? { min: Math.min(...values), max: Math.max(...values) } : {}),
    ...(note ? { note } : {}),
  }
}
