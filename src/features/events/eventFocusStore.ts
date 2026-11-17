import { useSyncExternalStore } from 'react'

/** De onde veio o hover: card da lista ou pino do mapa. */
export type HoverSource = 'list' | 'map'

export type EventFocusState = {
  /** Evento aberto nos detalhes (espelho de ?event= na URL). */
  selectedId: string | null
  /** Eventos em destaque por hover, e quem originou o destaque. */
  hover: { ids: readonly string[]; source: HoverSource } | null
}

/**
 * Fonte única de verdade para seleção e hover de eventos, compartilhada por lista, mapa e detalhes.
 *
 * Regras:
 * - Selecionar (ou trocar de) evento limpa o hover: o pino/card sai de baixo do mouse quando o
 *   mapa encolhe e se move, e o navegador não avisa que o mouse saiu.
 * - Cada origem só limpa o próprio hover (sair do card não apaga o hover do mapa e vice-versa).
 * - A seleção é gravada na URL (link compartilhável, "voltar" fecha); `syncSelectedFromUrl`
 *   traz a URL para cá, e todos os componentes leem daqui.
 */
let state: EventFocusState = { selectedId: null, hover: null }
const listeners = new Set<() => void>()

function setState(next: EventFocusState) {
  if (next.selectedId === state.selectedId && next.hover === state.hover) return
  state = next
  for (const listener of listeners) listener()
}

const sameIds = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id, i) => id === b[i])

export const eventFocus = {
  getState: () => state,

  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  /** Chamado quando ?event= muda na URL. */
  syncSelectedFromUrl(selectedId: string | null) {
    if (selectedId === state.selectedId) return
    setState({ selectedId, hover: null })
  },

  hover(ids: readonly string[], source: HoverSource) {
    if (ids.length === 0) return eventFocus.unhover(source)
    if (state.hover?.source === source && sameIds(state.hover.ids, ids)) return
    setState({ ...state, hover: { ids, source } })
  },

  unhover(source: HoverSource) {
    if (state.hover?.source === source) setState({ ...state, hover: null })
  },

  /** Para testes e ao sair da página. */
  reset() {
    setState({ selectedId: null, hover: null })
  },
}

/**
 * Lê uma fatia do estado. O seletor deve devolver um valor primitivo ou uma referência do próprio
 * estado (assim o componente só re-renderiza quando essa fatia muda).
 */
export function useEventFocus<T>(selector: (state: EventFocusState) => T): T {
  return useSyncExternalStore(eventFocus.subscribe, () => selector(state))
}
