// Utilitários de texto usados por domínio, SEO e telas.

const BLOCK_END = /<br\s*\/?>|<\/(?:p|div|li|h\d)>/gi
const ENTITIES: Record<string, string> = { '&amp;': '&', '&nbsp;': ' ', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }

type HtmlToTextOptions = {
  /** Mantém o href de cada link no texto (ex.: perfis do Instagram só no link). */
  keepLinks?: boolean
  /** Normaliza letras estilizadas (𝐅𝐨𝐥𝐤 → Folk) com NFKC. */
  normalize?: boolean
  /**
   * O que entra no lugar das outras tags: '' (padrão, para exibir: "<b>Hi</b>!" → "Hi!") ou ' ' (para
   * procurar palavras e @perfis sem grudar: "<b>@a</b><b>@b</b>" → "@a @b").
   */
  tagSeparator?: '' | ' '
}

/**
 * HTML da descrição do calendário → texto: quebra de linha no lugar de <br> e fim de parágrafo,
 * sem as outras tags, entidades comuns decodificadas e espaços repetidos juntados.
 */
export function htmlToText(
  html: string | undefined,
  { keepLinks = false, normalize = false, tagSeparator = '' }: HtmlToTextOptions = {},
): string {
  let text = (html ?? '').replace(BLOCK_END, '\n')
  if (keepLinks) text = text.replace(/<a\s[^>]*href="([^"]*)"[^>]*>/gi, ' $1 ')
  text = text
    .replace(/<[^>]*>/g, tagSeparator)
    .replace(/&(?:amp|nbsp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity])
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return normalize ? text.normalize('NFKC') : text
}

/** Distância de edição (Levenshtein): quantas letras trocar, pôr ou tirar para ir de `a` a `b`. */
export function levenshtein(a: string, b: string): number {
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
