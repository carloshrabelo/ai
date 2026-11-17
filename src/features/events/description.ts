import DOMPurify from 'dompurify'

const HAS_TAGS = /<[a-z][\s\S]*>/i
const URL_PATTERN = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/g

/**
 * Descrição do calendário (HTML de terceiros) → HTML seguro para renderizar.
 * - Texto puro: quebras de linha viram <br>.
 * - Sanitiza com DOMPurify (sem scripts, estilos, iframes…).
 * - URLs soltas no texto viram links; todos os links abrem em nova aba.
 */
export function renderDescription(raw: string): string {
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
  }

  const container = document.createElement('div')
  container.append(fragment)
  return container.innerHTML
}

function linkifyTextNodes(root: DocumentFragment) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.parentElement?.closest('a')) textNodes.push(node as Text)
  }

  for (const node of textNodes) {
    const text = node.data
    const matches = [...text.matchAll(URL_PATTERN)]
    if (matches.length === 0) continue

    const parts = document.createDocumentFragment()
    let last = 0
    for (const match of matches) {
      const start = match.index
      parts.append(text.slice(last, start))
      const anchor = document.createElement('a')
      anchor.href = match[0]
      anchor.textContent = match[0]
      parts.append(anchor)
      last = start + match[0].length
    }
    parts.append(text.slice(last))
    node.replaceWith(parts)
  }
}
