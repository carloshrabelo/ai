import { useEffect } from 'react'

export type DocumentHead = {
  title: string
  description: string
  /** URL canônica absoluta da página. */
  canonical: string
  /** Página que não deve ser indexada (404, evento que não existe mais). */
  noindex?: boolean
  /** Dados estruturados (Schema.org) em JSON-LD. */
  jsonLd?: Record<string, unknown>
}

/** URL absoluta do app ("https://carloshrabelo.github.io/ai/"), em produção e em dev. */
export const siteUrl = () => new URL(import.meta.env.BASE_URL, window.location.origin).href

/** URL compartilhável de um evento. */
export const eventUrl = (id: string) => `${siteUrl()}?event=${encodeURIComponent(id)}`

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.append(link)
  }
  link.href = href
}

const JSON_LD_ID = 'page-json-ld'

function setJsonLd(data: Record<string, unknown> | undefined) {
  document.getElementById(JSON_LD_ID)?.remove()
  if (!data) return
  const script = document.createElement('script')
  script.id = JSON_LD_ID
  script.type = 'application/ld+json'
  // "<" escapado: o JSON vem de dados de terceiros e não pode fechar a tag <script>.
  script.textContent = JSON.stringify(data).replace(/</g, '\\u003c')
  document.head.append(script)
}

/**
 * Título, descrição, canonical, Open Graph / Twitter, robots e JSON-LD da página atual.
 * O Google executa JavaScript e lê essas mudanças; redes sociais (WhatsApp, Facebook…) só leem
 * as tags fixas do index.html.
 */
export function useDocumentHead({ title, description, canonical, noindex = false, jsonLd }: DocumentHead) {
  const json = jsonLd ? JSON.stringify(jsonLd) : ''
  useEffect(() => {
    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonical)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow')
    setCanonical(canonical)
    setJsonLd(json ? (JSON.parse(json) as Record<string, unknown>) : undefined)
  }, [title, description, canonical, noindex, json])
}
