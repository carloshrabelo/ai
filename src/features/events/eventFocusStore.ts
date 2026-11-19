import { useSyncExternalStore } from 'react'

/** De onde veio o hover: card da lista ou pino do mapa. */
export type HoverSource = 'list' | 'map'

export type EventFocusState = {
  /** Slug do evento aberto nos detalhes (espelho de /event/<slug>/ na URL). */
  selectedSlug: string | null
  /** Onde o evento foi aberto: lista, mapa, ou null (link direto, "voltar" do navegador). */
  selectedFrom: HoverSource | null
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
const INITIAL: EventFocusState = { selectedSlug: null, selectedFrom: null, hover: null }
let state = INITIAL
const listeners = new Set<() => void>()

/** Origem da próxima seleção, gravada antes de a URL mudar (ver `willSelectFrom`). */
let pendingSource: HoverSource | null = null

function setState(next: EventFocusState) {
  if (next.selectedSlug === state.selectedSlug && next.selectedFrom === state.selectedFrom && next.hover === state.hover) return
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

  /**
   * Avisa de onde vem a seleção que está para acontecer (clique no card ou no pino).
   * Se o evento já está aberto, a URL não muda: atualiza a origem na hora.
   */
  willSelectFrom(source: HoverSource, slug: string) {
    if (slug === state.selectedSlug) setState({ ...state, selectedFrom: source })
    else pendingSource = source
  },

  /** Chamado quando o evento aberto muda na URL (/event/<slug>/). */
  syncSelectedFromUrl(selectedSlug: string | null) {
    const selectedFrom = selectedSlug ? pendingSource : null
    pendingSource = null
    if (selectedSlug === state.selectedSlug && selectedFrom === state.selectedFrom) return
    setState({ selectedSlug, selectedFrom, hover: null })
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
    pendingSource = null
    setState(INITIAL)
  },
}

/**
 * Lê uma fatia do estado. O seletor deve devolver um valor primitivo ou uma referência do próprio
 * estado (assim o componente só re-renderiza quando essa fatia muda).
 */
export function useEventFocus<T>(selector: (state: EventFocusState) => T): T {
  return useSyncExternalStore(eventFocus.subscribe, () => selector(state))
}
