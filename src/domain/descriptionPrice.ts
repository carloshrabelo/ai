// Preço lido da descrição, quando o título não traz preço (`Tag • Nome` sem o terceiro trecho).
// Tabela de valores numa linha ("12€ | 10€"), valor com bebida ("10€ com bebida") ou entrada gratuita. Para revisar: /teste/sem-preco.

/** Preço exibido para entrada gratuita (o tradutor de src/i18n/price.ts faz o en-US: "Free"). */
export const FREE_PRICE = 'Gratuito'

const FREE = '(?:gr[aá]tis|gratuit[ao]|livre|free)'
// Gratuidade parcial não conta: "Free entry until 23h", "Entrada grátis antes das 22h", "… para sócios".
// "Para todos" / "for everyone" continua gratuito.
const NOT_PARTIAL =
  '(?!\\s+(?:at[eé]|until|till|before|antes)(?!\\p{L}))(?!\\s+(?:para|for)\\s+(?!tod[oa]s|everyone|all)\\p{L})'

/**
 * Dicionário de frases de entrada gratuita, comparadas com o texto já sem formatação (ver
 * `normalize`). Exemplos vistos no calendário ao lado de cada uma.
 */
const FREE_PHRASES: RegExp[] = [
  // "🎟️ Entrada Grátis", "Entrada Livre", "Entrada: gratuita", "Entry free"
  new RegExp(`\\b(?:entrada|entry|entrance)\\s*:?\\s*${FREE}\\b${NOT_PARTIAL}`, 'iu'),
  // "💸FREE ENTRY", "Free entrance", "Free admission"
  new RegExp(`\\bfree\\s+(?:entry|entrance|admission)\\b${NOT_PARTIAL}`, 'iu'),
  // "𝐏𝐫𝐢𝐜𝐞: Free!", "Preço: grátis"
  new RegExp(`\\b(?:price|pre[cç]o)\\s*:?\\s*${FREE}\\b${NOT_PARTIAL}`, 'iu'),
  // "FREE TO ATTEND."
  new RegExp(`\\bfree\\s+to\\s+attend\\b${NOT_PARTIAL}`, 'iu'),
  // "🎟️ FREE COMMUNITY EVENT"
  /\bfree\s+community\b/iu,
]

/**
 * Texto comparável: NFKC desfaz letras "estilizadas" do Unicode (𝐏𝐫𝐢𝐜𝐞 → Price) e emojis colados
 * ("💸FREE") viram espaço.
 */
function normalize(text: string): string {
  return text.normalize('NFKC').replace(/[^\p{L}\p{N}\s:]/gu, ' ').replace(/\s+/g, ' ')
}

// Valor em euros: "12€", "12 €", "€12", "7,50€".
const EURO = /(\d+(?:[.,]\d{1,2})?)\s*€|€\s*(\d+(?:[.,]\d{1,2})?)/g

/**
 * Tabela de preços numa linha só, com os valores separados por "|":
 * "💵 12€ | 10€ para alunos" → "12€ | 10€"; "(1 class: 15€ | 2 classes: 20€)" → "15€ | 20€".
 * Cada trecho entre "|" precisa de exatamente um valor.
 */
function priceTable(line: string): string | undefined {
  const parts = line.split('|')
  if (parts.length < 2) return undefined
  const amounts = parts.map((part) => [...part.matchAll(EURO)].map((match) => `${match[1] ?? match[2]}€`))
  if (amounts.some((found) => found.length !== 1)) return undefined
  return amounts.map(([amount]) => amount).join(' | ')
}

/** Preço exibido quando o valor inclui bebida. */
const WITH_DRINK = (amount: string) => `${amount} com bebida`

// "gets you … a beer", "includes a drink", "inclui uma bebida", "com cerveja".
const INCLUDES_DRINK = /\b(?:gets you|includes?|including|inclui|com|with)\b.*\b(?:beer|drinks?|bebidas?|cervejas?)\b/iu

/**
 * Um valor só, que inclui bebida: "€10 gets you the class and a beer/ soft drink" → "10€ com bebida".
 */
function priceWithDrink(line: string): string | undefined {
  const found = [...line.matchAll(EURO)]
  if (found.length !== 1) return undefined
  const [match] = found
  const after = line.slice((match.index ?? 0) + match[0].length)
  return INCLUDES_DRINK.test(after) ? WITH_DRINK(`${match[1] ?? match[2]}€`) : undefined
}

/** HTML da descrição → linhas de texto. */
function lines(html: string): string[] {
  return html
    .replace(/<br\s*\/?>|<\/(?:p|div|li|h\d)>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&nbsp;', ' ')
    .normalize('NFKC')
    .split('\n')
}

/** Preço encontrado na descrição (HTML ou texto), ou undefined. */
export function priceFromDescription(html: string | undefined): string | undefined {
  if (!html) return undefined
  const textLines = lines(html)
  for (const line of textLines) {
    const price = priceTable(line) ?? priceWithDrink(line)
    if (price) return price
  }
  const normalized = normalize(textLines.join('\n'))
  return FREE_PHRASES.some((phrase) => phrase.test(normalized)) ? FREE_PRICE : undefined
}
