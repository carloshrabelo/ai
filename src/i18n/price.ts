import type { Locale } from './locale'

// O preço vem do título do evento no calendário (`Tag • Nome • Preço`), escrito à mão em
// português, com variações e erros de digitação. A tradução é por partes (não por frase inteira):
// os mesmos pedaços se repetem em combinações diferentes ("7€ ou 10€ (bebida incluída)").
// Texto desconhecido fica como veio. Lista completa para revisar: /teste/precos (VITE_TEST_PAGES).

type Rule = [pattern: RegExp, replacement: string]

// Fronteira de palavra que entende acentos (o \b do JS só conhece [A-Za-z0-9_]).
const W = (word: string) => new RegExp(`(?<![\\p{L}\\d])${word}(?![\\p{L}\\d])`, 'giu')

/** Padroniza o português: grafia, acentos, maiúsculas e espaços. */
const NORMALIZE: Rule[] = [
  [/\s+/g, ' '],
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
