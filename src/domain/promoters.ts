// Responsáveis por um evento, lidos da descrição: perfis do Instagram (@perfil ou link
// instagram.com/perfil) e frases de organização ("Organização: WCS Portugal"). O calendário não tem
// esse campo; o `creator` do Google é quem cadastrou o evento, não quem o promove.

export type EventPromoters = {
  /** Perfis do Instagram, em minúsculas, sem repetição, na ordem em que aparecem. */
  handles: string[]
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
  if (!description) return { handles: [] }
  const text = plainText(description)
  const handles = new Set<string>()
  // Na ordem do texto: @perfil e links misturados.
  const found = [
    ...[...text.matchAll(HANDLE)].map((match) => ({ at: match.index ?? 0, handle: match[1] })),
    ...[...text.matchAll(INSTAGRAM_URL)]
      .filter((match) => !NOT_PROFILES.has(match[1].toLowerCase()))
      .map((match) => ({ at: match.index ?? 0, handle: match[1].replace(/\.+$/, '') })),
  ].sort((a, b) => a.at - b.at)
  for (const { handle } of found) handles.add(handle.toLowerCase())

  const organizedBy = text.match(ORGANIZED_BY)?.[1].trim().replace(/[.!]+$/, '')
  return { handles: [...handles], ...(organizedBy ? { organizedBy } : {}) }
}
