import DOMPurify from 'dompurify'

const HAS_TAGS = /<[a-z][\s\S]*>/i

/**
 * URL solta ou @perfil do Instagram. O @ não pode vir colado a letra, número, ponto ou "/"
 * (assim e-mails como "nome@site.pt" e URLs com @ não viram perfil).
 */
const LINKABLE = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]|(?<![\w.@/])@([A-Za-z0-9._]{2,30}[A-Za-z0-9_])/g

/** Textos dos rótulos curtos, no idioma ativo. */
export type DescriptionLabels = {
  /** Link para uma publicação/reel do Instagram ("Ver no Instagram"). */
  instagramPost: string
}

/**
 * Descrição do calendário (HTML de terceiros) → HTML seguro para renderizar.
 * - Texto puro: quebras de linha viram <br>.
 * - Sanitiza com DOMPurify (sem scripts, estilos, iframes…).
 * - URLs soltas e @perfis viram links; todos abrem em nova aba.
 * - Link cujo texto é a própria URL ganha um rótulo curto (ver `friendlyLinkText`).
 */
export function renderDescription(raw: string, labels: DescriptionLabels): string {
  // Sem suporte a DOMPurify, ele devolveria a entrada sem sanitizar: mostra só o texto.
  if (!DOMPurify.isSupported) {
    const text = document.createElement('div')
    text.textContent = raw.replace(/<[^>]*>/g, ' ')
    return text.innerHTML
  }

  const html = HAS_TAGS.test(raw) ? raw : raw.replace(/\r?\n/g, '<br>')
  const fragment = DOMPurify.sanitize(html, {
    RETURN_DOM_FRAGMENT: true,
    FORBID_TAGS: ['style', 'img', 'iframe', 'form', 'input'],
  })

  linkifyTextNodes(fragment)

  for (const anchor of fragment.querySelectorAll('a')) {
    anchor.setAttribute('target', '_blank')
    anchor.setAttribute('rel', 'noopener noreferrer')
    const text = anchor.textContent?.trim() ?? ''
    if (/^https?:\/\//i.test(text)) {
      anchor.textContent = friendlyLinkText(anchor.href, labels)
      anchor.title = anchor.href // URL completa ao passar o mouse
    }
  }

  removeRepeatedLinkLines(fragment)

  const container = document.createElement('div')
  container.append(fragment)
  // Mais de uma linha em branco seguida vira uma só.
  return container.innerHTML.replace(/(<br>\s*){3,}/g, '<br><br>')
}

const isBlank = (node: ChildNode | null) => !node || (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim())
const isLineBreak = (node: ChildNode | null) => !node || (node instanceof HTMLElement && node.tagName === 'BR')

/**
 * Link repetido sozinho numa linha (ex.: "Mais info: @perfil" e, mais abaixo, só "@perfil"): a
 * segunda linha sai. Links repetidos no meio de uma frase ficam.
 */
function removeRepeatedLinkLines(root: DocumentFragment) {
  const seen = new Set<string>()
  for (const anchor of [...root.querySelectorAll('a')]) {
    // Mesmo destino, com ou sem www e barra final.
    const key = anchor.href.toLowerCase().replace('://www.', '://').replace(/\/+$/, '')
    if (!seen.has(key)) {
      seen.add(key)
      continue
    }
    let before = anchor.previousSibling
    while (before && isBlank(before) && before.nodeType === Node.TEXT_NODE) before = before.previousSibling
    let after = anchor.nextSibling
    while (after && isBlank(after) && after.nodeType === Node.TEXT_NODE) after = after.nextSibling
    if (isLineBreak(before) && isLineBreak(after)) {
      after?.remove()
      anchor.remove()
    }
  }
}

/**
 * Rótulo curto para um link que só mostrava a URL:
 * - publicação/reel do Instagram → "Ver no Instagram"
 * - perfil do Instagram → "@perfil"
 * - outros → domínio + caminho curto ("linktr.ee/lisbonwestiefest", "goandance.com/…")
 */
export function friendlyLinkText(href: string, labels: DescriptionLabels): string {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return href
  }
  const host = url.hostname.replace(/^www\./, '')
  const path = url.pathname.replace(/\/+$/, '')
  const segments = path.split('/').filter(Boolean)

  if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
    if (['p', 'reel', 'reels', 'tv', 'stories'].includes(segments[0] ?? '')) return labels.instagramPost
    if (segments.length === 1) return `@${segments[0]}`
  }
  if (segments.length === 0) return host
  const short = `${host}/${segments.join('/')}`
  return short.length <= 32 ? short : `${host}/…`
}

function linkifyTextNodes(root: DocumentFragment) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.parentElement?.closest('a')) textNodes.push(node as Text)
  }

  for (const node of textNodes) {
    const text = node.data
    const matches = [...text.matchAll(LINKABLE)]
    if (matches.length === 0) continue

    const parts = document.createDocumentFragment()
    let last = 0
    for (const match of matches) {
      const start = match.index
      parts.append(text.slice(last, start))
      const anchor = document.createElement('a')
      const handle = match[1]
      // @perfil → perfil no Instagram (os perfis citados nas descrições são do Instagram).
      anchor.href = handle ? `https://www.instagram.com/${handle}/` : match[0]
      anchor.textContent = match[0]
      parts.append(anchor)
      last = start + match[0].length
    }
    parts.append(text.slice(last))
    node.replaceWith(parts)
  }
}
