import type { Locale } from '../../i18n/locale'

// Preço padronizado e traduzido, em texto. O preço vem do título do evento no calendário
// (`Tag • Nome • Preço`) ou da descrição (descriptionPrice.ts), escrito à mão em português (às vezes
// em inglês, no calendário de tango), com variações e erros de digitação. A tradução é por partes
// (não por frase inteira): os mesmos pedaços se repetem em combinações diferentes ("7€ ou 10€
// (bebida incluída)"). Texto desconhecido fica como veio. Lista completa para revisar: /teste/precos.
//
// Os módulos de preço (src/domain/price/): descriptionPrice (acha o preço na descrição),
// translatePrice (texto padronizado/traduzido: SEO, calendário), labeledPrice (valores com rótulo:
// os chips do app) e priceParts (partes, só para comparar formatos em /teste/formato-precos).

type Rule = [pattern: RegExp, replacement: string]

// Fronteira de palavra que entende acentos (o \b do JS só conhece [A-Za-z0-9_]).
const W = (word: string) => new RegExp(`(?<![\\p{L}\\d])${word}(?![\\p{L}\\d])`, 'giu')

/** Padroniza o português: grafia, acentos, maiúsculas e espaços. */
const NORMALIZE: Rule[] = [
  [/\s+/g, ' '],
  // Preços em inglês (calendário de tango): "€5" → "5€", e as palavras em português.
  [/€\s*(\d+(?:[.,]\d+)?)/g, '$1€'],
  [/\s*\bfor (?:non-?)?members\b/gi, ''], // "€5 for members / €10 for non-members" → "5€ / 10€"
  [/(\d€)\s*[/|]\s*(?=\d)/g, '$1 ou '], // "5€ / 10€", "15€ | 20€" → "5€ ou 10€", "15€ ou 20€"
  [W('or'), 'ou'],
  [/(\d€) to (?=\d)/g, '$1 a '], // "5€ to 15€" → "5€ a 15€"
  [W('flexible'), 'flexível'],
  [W('for students of'), 'para alunos de'],
  [W('for students'), 'para alunos'],
  [/(\d)\s*€/g, '$1€'], // "7 €" → "7€"
  [/€(?=\p{L})/gu, '€ '], // "8€ou 10€" → "8€ ou 10€"
  [W('contribui[cç][aã]o volunt[aá]ria'), 'Contribuição voluntária'],
  [W('doa[cç][aã]o'), 'Contribuição voluntária'],
  [W('pago'), 'Pago'],
  [W('paid'), 'Pago'],
  [W('gr[aá]tis|gratuito|free'), 'Gratuito'],
  [W('bebidas? inclu[ií]d[aos]s?'), 'bebida incluída'],
  [/(?<!\d)0(\d)h/g, '$1h'], // "01h" → "1h"
]

/** Português (já padronizado) → inglês. A ordem importa: frases antes das palavras soltas. */
const TO_ENGLISH: Rule[] = [
  // "10€ até 1h após 12€": 10€ até a 1h da manhã, 12€ depois.
  [/(\S+) até (\d{1,2})h após (\S+)/g, '$1 until $2am, then $3'],
  [/(\d€) a (?=\d)/g, '$1 to '], // "5€ a 15€" → "5€ to 15€"
  [W('flexível'), 'flexible'],
  [W('para alunos de'), 'for students of'],
  [W('para alunos'), 'for students'],
  [W('Contribuição voluntária'), 'Donation'],
  [W('Pago'), 'Paid'],
  [W('Gratuito'), 'Free'],
  [W('bebida incluída'), 'drink included'],
  [W('com bebida'), 'with a drink'],
  [W('consumo mínimo'), 'minimum spend'],
  [W('acesso à'), 'access to'],
  [W('alunos'), 'students'],
  [W('porta'), 'at the door'],
  [W('ou'), 'or'],
  [/(\d+(?:[.,]\d+)?)€/g, '€$1'], // "7€" → "€7"
]

const apply = (text: string, rules: Rule[]) => rules.reduce((out, [pattern, replacement]) => out.replace(pattern, replacement), text)

/** Preço padronizado em português (o texto exibido em pt-BR). */
export function normalizePrice(raw: string): string {
  const text = apply(raw.trim(), NORMALIZE)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Preço no idioma da interface. */
export function translatePrice(raw: string, locale: Locale): string {
  const pt = normalizePrice(raw)
  return locale === 'pt-BR' ? pt : apply(pt, TO_ENGLISH)
}
