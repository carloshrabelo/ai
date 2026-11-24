/**
 * Suporte aos testes de componente (ambiente jsdom). Importar no topo do teste, depois do comentário
 * `// @vitest-environment jsdom`:
 *
 *   import { setViewport } from '../../test/dom'
 *
 * O jsdom não tem layout, `matchMedia`, `ResizeObserver` nem `<dialog>.showModal`: aqui ficam versões mínimas,
 * suficientes para os componentes montarem. Medidas (getBoundingClientRect, scrollWidth…) continuam zero; os
 * testes que dependem delas definem os valores no próprio elemento.
 */
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  setViewport(390)
})

/** Largura simulada da tela, usada pelas media queries `(min-width: …)`. */
let viewportWidth = 390
const mediaListeners = new Set<() => void>()

/** Muda a largura simulada (ex.: 1440 para `xl`) e avisa quem usa `useMediaQuery`. */
export function setViewport(width: number) {
  viewportWidth = width
  for (const listener of mediaListeners) listener()
}

function matches(query: string): boolean {
  const minWidth = query.match(/min-width:\s*([\d.]+)(px|rem)/)
  if (minWidth) return viewportWidth >= Number(minWidth[1]) * (minWidth[2] === 'rem' ? 16 : 1)
  if (query.includes('prefers-reduced-motion')) return true // sem animação nos testes
  return false
}

window.matchMedia = (query: string) =>
  ({
    get matches() {
      return matches(query)
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, listener: () => void) => mediaListeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => mediaListeners.delete(listener),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

/** `<dialog>` sem `showModal`/`close` no jsdom: abrir e fechar só trocam o atributo `open`. */
function polyfillDialog(name: 'showModal' | 'close', open: boolean) {
  if (Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name)) return
  Object.defineProperty(HTMLDialogElement.prototype, name, {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.toggleAttribute('open', open)
    },
  })
}
polyfillDialog('showModal', true)
polyfillDialog('close', false)

// O jsdom não implementa a rolagem: vira no-op (os testes que conferem a rolagem usam vi.spyOn).
window.scrollTo = (() => {}) as typeof window.scrollTo
Element.prototype.scrollTo = function () {} as typeof Element.prototype.scrollTo
Element.prototype.scrollIntoView = function () {}
