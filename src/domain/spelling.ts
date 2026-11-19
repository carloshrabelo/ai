// Revisão de texto dos eventos (/review): erros de ortografia (LanguageTool) e perfis do Instagram
// escritos errado (os `aliases` de promoters.json), com a correção aplicada no texto original.
//
// As descrições misturam português (de Portugal e do Brasil), inglês e espanhol, e o LanguageTool
// verifica uma língua por vez. Por isso o texto vai para cada língua, e só conta como erro a palavra
// que todas marcam. Nomes de pessoas, locais e estilos ("Tropicavana", "kizomba") também são
// marcados: ficam de fora as palavras sem sugestão parecida (ver `maxDistance`) e as da lista
// `IGNORED_WORDS`.

type IssueKind = 'spelling' | 'alias'

export type Issue = {
  kind: IssueKind
  /** Posição no texto puro (ver `toPlain`). */
  offset: number
  length: number
  /** Trecho errado, como está no texto. */
  word: string
  /** Sugestões, da mais provável para a menos; a primeira é a aplicada por padrão. */
  suggestions: string[]
}

/** Um erro de ortografia como o LanguageTool devolve (só os campos usados). */
export type ToolMatch = { offset: number; length: number; replacements: { value: string }[] }

// Estilos, termos de dança e palavras comuns nos eventos que os dicionários não conhecem.
export const IGNORED_WORDS = new Set(
  [
    'bachata',
    'bachateiros',
    'kizomba',
    'kizombeiros',
    'zouk',
    'semba',
    'kompa',
    'tarraxinha',
    'tarraxa',
    'urbankiz',
    'kiz',
    'forró',
    'forro',
    'forrozeiros',
    'xote',
    'baião',
    'baiao',
    'xaxado',
    'salsa',
    'salseros',
    'salsera',
    'mambo',
    'timba',
    'rueda',
    'casino',
    'cubana',
    'cha',
    'merengue',
    'reggaeton',
    'dembow',
    'lindy',
    'hop',
    'balboa',
    'shag',
    'blues',
    'wcs',
    'westie',
    'tango',
    'milonga',
    'milongas',
    'tanda',
    'tandas',
    'cortina',
    'práctica',
    'pratica',
    'sevillanas',
    'flamenco',
    'kuduro',
    'afrohouse',
    'afro',
    'amapiano',
    'dancehall',
    'twerk',
    'hustle',
    'boogie',
    'woogie',
    'rockabilly',
    'dj',
    'djs',
    'deejay',
    'mc',
    'djay',
    'tlm',
    'workshop',
    'workshops',
    'bootcamp',
    'social',
    'sociais',
    'rooftop',
    'sunset',
    'lounge',
    'open',
    'air',
    'warm',
    'up',
    'line',
    'dance',
    'insta',
    'instagram',
    'facebook',
    'whatsapp',
    'tiktok',
    'online',
    'lisboa',
    'lisbon',
    'cais',
    'sodré',
    'alcântara',
    'intendente',
    'alfama',
    'mouraria',
    'bairro',
    'alto',
    'chiado',
    'mbway',
    'iban',
  ].map((word) => word.normalize('NFC')),
)

/**
 * Até quantas letras de diferença uma sugestão ainda é "parecida" (mais que isso costuma ser nome
 * próprio ou palavra de outra língua): 2 ("comessa" → "começa"), mas só 1 para palavra com
 * maiúscula (nomes: "Tropicavana" × "Tropicavam") ou curta, e palavra de até 2 letras nunca entra.
 */
function maxDistance(word: string): number {
  if (word.length <= 2) return -1
  return word.length <= 4 || word[0] !== word[0].toLowerCase() ? 1 : 2
}

/** Quantas sugestões mostrar. */
const MAX_SUGGESTIONS = 5

/** Texto puro de uma descrição e, para cada caractere dele, o trecho [início, fim) no original. */
export type PlainText = { text: string; spans: [number, number][] }

const LINE_TAGS = /^<(?:br\s*\/?|\/(?:p|div|li|h\d))>$/i
const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }

/**
 * Tira o HTML da descrição (o Google às vezes manda HTML, às vezes texto com quebras de linha),
 * guardando onde cada caractere estava, para aplicar a correção no original sem perder a formatação.
 */
export function toPlain(source: string): PlainText {
  let text = ''
  const spans: [number, number][] = []
  const push = (chars: string, start: number, end: number) => {
    for (const char of chars) {
      text += char
      spans.push([start, end])
    }
  }
  const token = /<[^>]*>|&(?:amp|lt|gt|quot|#39|nbsp);/gi
  let last = 0
  for (const match of source.matchAll(token)) {
    const at = match.index ?? 0
    for (let i = last; i < at; i++) push(source[i], i, i + 1)
    const end = at + match[0].length
    if (match[0].startsWith('&')) push(ENTITIES[match[0].toLowerCase()], at, end)
    else if (LINE_TAGS.test(match[0])) push('\n', at, end)
    last = end
  }
  for (let i = last; i < source.length; i++) push(source[i], i, i + 1)
  return { text, spans }
}

/** Trechos que não são texto corrido: @perfis, links e e-mails. */
function codeRanges(text: string): [number, number][] {
  const pattern = /@[\p{L}\p{N}_.]+|https?:\/\/\S+|www\.\S+|[\w.+-]+@[\w-]+\.[\w.]+/giu
  return [...text.matchAll(pattern)].map((match) => [match.index ?? 0, (match.index ?? 0) + match[0].length])
}

function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    previous = current
  }
  return previous[b.length]
}

/**
 * Erros de ortografia de um texto a partir das respostas do LanguageTool, uma por língua: só entra
 * a palavra marcada em todas, fora de @perfis e links, fora de `ignored`, e com ao menos uma
 * sugestão parecida. As sugestões das línguas são juntadas, as mais parecidas primeiro.
 */
export function spellingIssues(text: string, byLanguage: ToolMatch[][], ignored: ReadonlySet<string> = IGNORED_WORDS): Issue[] {
  if (byLanguage.length === 0) return []
  const key = (match: ToolMatch) => `${match.offset}:${match.length}`
  const others = byLanguage.slice(1).map((matches) => new Map(matches.map((match) => [key(match), match])))
  const code = codeRanges(text)
  const issues: Issue[] = []
  for (const match of byLanguage[0]) {
    const same = others.map((matches) => matches.get(key(match)))
    if (same.some((other) => !other)) continue
    const end = match.offset + match.length
    if (code.some(([start, stop]) => match.offset < stop && end > start)) continue
    const word = text.slice(match.offset, end)
    if (ignored.has(word.toLowerCase().normalize('NFC'))) continue
    if (/\d/.test(word)) continue
    const lower = word.toLowerCase()
    const limit = maxDistance(word)
    // Nome próprio: sugestão que só muda maiúsculas ("BreakPoint") ou parte a palavra ("Fogar até",
    // "Tropicava-a") não é correção.
    const isName = word[0] !== word[0].toLowerCase()
    const suggestions = [...new Set([match, ...same].flatMap((m) => m?.replacements.map((r) => r.value) ?? []))]
      .filter((value) => !isName || (!/[\s-]/.test(value) && value.toLowerCase() !== lower))
      .map((value) => ({ value, distance: levenshtein(lower, value.toLowerCase()) }))
      .filter(({ distance }) => distance <= limit)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_SUGGESTIONS)
      .map(({ value }) => value)
    if (suggestions.length > 0) issues.push({ kind: 'spelling', offset: match.offset, length: match.length, word, suggestions })
  }
  return issues
}

/** Perfis escritos errado (@grafia ou instagram.com/grafia), com a grafia certa. */
export function aliasIssues(text: string, correctOf: ReadonlyMap<string, string>): Issue[] {
  const issues: Issue[] = []
  for (const match of text.matchAll(/(?:(?<![\p{L}\p{N}_.@/])@|instagram\.com\/)([a-z0-9_.]+)/giu)) {
    const handle = match[1].replace(/\.+$/, '')
    const right = correctOf.get(handle.toLowerCase())
    if (!right) continue
    const offset = (match.index ?? 0) + match[0].length - match[1].length
    issues.push({ kind: 'alias', offset, length: handle.length, word: handle, suggestions: [right] })
  }
  return issues
}

/** Uma correção a aplicar: trecho do texto puro e o que entra no lugar. */
export type Fix = { offset: number; length: number; value: string }

/** Aplica as correções no texto original (com HTML), da última para a primeira. */
export function applyFixes(source: string, plain: PlainText, fixes: readonly Fix[]): string {
  let result = source
  for (const fix of [...fixes].sort((a, b) => b.offset - a.offset)) {
    const start = plain.spans[fix.offset]?.[0]
    const end = plain.spans[fix.offset + fix.length - 1]?.[1]
    if (start === undefined || end === undefined) continue
    result = result.slice(0, start) + fix.value + result.slice(end)
  }
  return result
}
