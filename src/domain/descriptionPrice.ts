// Preço lido da descrição, quando o título não traz preço (`Tag • Nome` sem o terceiro trecho).
// Por enquanto só entrada gratuita. Para revisar: /teste/sem-preco (VITE_TEST_PAGES=true).

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
]

/**
 * Texto comparável: NFKC desfaz letras "estilizadas" do Unicode (𝐏𝐫𝐢𝐜𝐞 → Price) e emojis colados
 * ("💸FREE") viram espaço.
 */
function normalize(text: string): string {
  return text.normalize('NFKC').replace(/[^\p{L}\p{N}\s:]/gu, ' ').replace(/\s+/g, ' ')
}

/** Preço encontrado no texto da descrição, ou undefined. */
export function priceFromDescription(text: string): string | undefined {
  const normalized = normalize(text)
  return FREE_PHRASES.some((phrase) => phrase.test(normalized)) ? FREE_PRICE : undefined
}
