// Perfis do Instagram citados na descrição de um evento (@perfil ou link instagram.com/perfil), com
// o papel de cada um deduzido do texto em volta, e frases de organização ("Organização: WCS
// Portugal"). O calendário não tem campo de responsável; o `creator` do Google é quem cadastrou o
// evento, não quem o promove.
//
// Convenção do calendário: o responsável vem numa linha "Mais info: @perfil". Os outros @ aparecem
// no meio do texto e são DJs ("🎧 DJ Oksi @ksuh_oh"), professores ("10:30–11:30 | Foundations —
// Sofi Sartori @sofiaylosdinos", "Workshop … com @dcasty"), locais ("arrives at @copoalto") ou
// outros (parceiros, contatos: "Envia DM para @…").

export const ROLES = ['promoter', 'dj', 'teacher', 'venue', 'other'] as const
export type Role = (typeof ROLES)[number]

type Mention = { handle: string; role: Role }

export type EventPromoters = {
  /** Perfis citados, em minúsculas, sem repetição, na ordem em que aparecem, com o papel no evento. */
  mentions: Mention[]
  /** Texto de "Organização: …" / "Organized by …", quando houver. */
  organizedBy?: string
}

// @perfil: letras, números, "_" e "." (sem "." no fim). Não pega e-mails (letra antes do @).
const HANDLE = /(?<![\p{L}\p{N}_.@/])@([a-z0-9_](?:[a-z0-9_.]{0,28}[a-z0-9_])?)/giu

// instagram.com/perfil (sem caminhos de post, reel, stories…).
const INSTAGRAM_URL = /instagram\.com\/([a-z0-9_.]+)/gi
const NOT_PROFILES = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'tv', 'accounts', 's', 'share'])

const ORGANIZED_BY =
  /(?:organiza[cç][aã]o(?:\s+d[aeo]s?(?!\p{L}))?|organization|organizad[oa]s?\s+(?:por|pel[oa]s?)|organi[sz]ed\s+by|hosted\s+by)\s*:?\s*([^\n]{2,80})/iu

// Cabeçalho do bloco de responsáveis: "Mais info:" seguido, na mesma linha ou nas de baixo, de @perfis
// e links (ver `promoterBlocks`).
const PROMOTER_HEADER = /(?:^|\n)\s*(?:\+\s*)?(?:mais\s+info(?:rma[cç][oõ]es)?|more\s+info|info)\s*:/giu
const PROMOTER_LINE = /^\s*(?:\+\s*)?(?:mais\s+info(?:rma[cç][oõ]es)?|more\s+info|info)\s*:/iu
// Linha só com @perfis e links.
const ONLY_HANDLES = /^(?:\s*(?:@[\p{L}\p{N}_.]+|https?:\/\/\S+)\s*)+$/u

// Papel pelo texto da linha antes do @ (ver `roleOf`).
// "DJ Oksi @…", "DJs convidados … @a @b @c" (a dica vale para a sequência de @ que vem depois).
const DJ_BEFORE = /(?<!\p{L})(?:dj'?s?|djay|deejay|music\s+by|m[uú]sica\s+(?:por|com))(?!\p{L})[^@\n]{0,60}(?:@[\p{L}\p{N}_.]+\s*)*$/iu
const DJ_HANDLE = /(?:^|[._])dj|^djay/i
const VENUE_BEFORE = /(?:(?<!\p{L})(?:at|in|em|no|na|junto\s+ao?|where|onde|local|venue)\s*[:\-–—]?\s*|venue\b[^@]{0,40})$/iu
const TEACHER_LINE =
  /workshop|(?<!\p{L})aulas?(?!\p{L})|(?<!\p{L})class(?:es)?(?!\p{L})|foundations|professor|teacher|lesson|instrutor|bootcamp|curso|course|\d{1,2}[:h]\d{2}\s*[–-]\s*\d{1,2}[:h]\d{2}\s*\|/iu

/** Papel de uma menção pelo texto da mesma linha antes dela. */
export function roleOf(handle: string, lineBefore: string): Role {
  if (PROMOTER_LINE.test(lineBefore)) return 'promoter'
  if (DJ_BEFORE.test(lineBefore) || DJ_HANDLE.test(handle)) return 'dj'
  if (VENUE_BEFORE.test(lineBefore)) return 'venue'
  if (TEACHER_LINE.test(lineBefore)) return 'teacher'
  return 'other'
}

/**
 * Trechos [início, fim) do texto com os responsáveis: depois de cada "Mais info:", o resto da linha e
 * as linhas seguintes que só têm @perfis ou links (pulando linhas em branco antes delas), até a
 * primeira linha que não é assim. Ex.: "Mais info: \n@salsaconsol\n@almacalena.lisboa\n\nTexto…".
 */
function promoterBlocks(text: string): [number, number][] {
  const blocks: [number, number][] = []
  for (const header of text.matchAll(PROMOTER_HEADER)) {
    const start = (header.index ?? 0) + header[0].length
    let end = start
    let seen = false
    let position = start
    for (const line of text.slice(start).split('\n')) {
      const next = position + line.length + 1
      if (line.trim() === '') {
        if (seen) break
      } else if (ONLY_HANDLES.test(line)) {
        seen = true
        end = next
      } else break
      position = next
    }
    blocks.push([start, end])
  }
  return blocks
}

function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>|<\/(?:p|div|li|h\d)>/gi, '\n')
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>/gi, ' $1 ') // mantém os links (perfil no href)
    .replace(/<[^>]*>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&nbsp;', ' ')
    .normalize('NFKC')
}

export function extractPromoters(description: string | undefined): EventPromoters {
  if (!description) return { mentions: [] }
  const text = plainText(description)
  // Na ordem do texto: @perfil e links misturados.
  const found = [
    ...[...text.matchAll(HANDLE)].map((match) => ({ at: match.index ?? 0, handle: match[1] })),
    ...[...text.matchAll(INSTAGRAM_URL)]
      .filter((match) => !NOT_PROFILES.has(match[1].toLowerCase()))
      .map((match) => ({ at: match.index ?? 0, handle: match[1].replace(/\.+$/, '') })),
  ].sort((a, b) => a.at - b.at)

  const blocks = promoterBlocks(text)
  const mentions = new Map<string, Role>()
  // Listas de @ ("DJs convidados:\n@a @b\n@c"): numa linha que só tem @, o contexto é a linha de cima,
  // e cada @ seguinte na mesma linha herda o papel do anterior.
  let previous: { role: Role; lineStart: number } | undefined
  for (const { at, handle } of found) {
    const key = handle.toLowerCase()
    const lineStart = text.lastIndexOf('\n', at - 1) + 1
    const lineBefore = text.slice(lineStart, at)
    const onlyHandlesBefore = /^\s*(?:@[\p{L}\p{N}_.]+\s*)*$/u.test(lineBefore)
    const previousLine = lineStart > 0 ? text.slice(text.lastIndexOf('\n', lineStart - 2) + 1, lineStart - 1) : ''
    let role: Role
    if (blocks.some(([start, end]) => at >= start && at < end)) role = 'promoter'
    else if (onlyHandlesBefore && lineBefore.trim() && previous?.lineStart === lineStart) role = previous.role
    else if (onlyHandlesBefore && !lineBefore.trim()) {
      const fromAbove = roleOf(key, `${previousLine} `)
      role =
        fromAbove === 'other' &&
        previous &&
        previous.lineStart < lineStart &&
        previous.lineStart >= text.lastIndexOf('\n', lineStart - 2) + 1
          ? previous.role
          : fromAbove
    } else role = roleOf(key, lineBefore)
    previous = { role, lineStart }
    // Citado duas vezes no mesmo evento: "promotor" vale mais que os outros papéis.
    if (!mentions.has(key) || role === 'promoter') mentions.set(key, role)
  }

  const organizedBy = text
    .match(ORGANIZED_BY)?.[1]
    .trim()
    .replace(/[.!]+$/, '')
  return {
    mentions: [...mentions].map(([handle, role]) => ({ handle, role })),
    ...(organizedBy ? { organizedBy } : {}),
  }
}
