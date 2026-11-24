import type { QueryClient } from '@tanstack/react-query'
import type { IsoDate } from '../lib/dates'
import { type EventsPage, eventsInfiniteQueryOptions } from './queries'

// Primeira janela da agenda embutida no HTML (scripts/prerender.ts, a partir do cache dos eventos): o
// app desenha os cards assim que o JavaScript carrega, sem esperar a Google Calendar API (era o que
// atrasava o LCP). Os dados entram com a data do build, então a API é consultada em seguida e
// substitui o que mudou.

const ELEMENT_ID = 'initial-events'

export type InitialEvents = {
  /** Quando o cache de onde saíram foi gerado (ISO): a "idade" dos dados para o TanStack Query. */
  generatedAt: string
  page: EventsPage
}

/** <script> para o <head> da página (JSON com `<` escapado: não fecha a tag no meio). */
export function initialEventsScript(data: InitialEvents): string {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<script type="application/json" id="${ELEMENT_ID}">${json}</script>`
}

function readInitialEvents(): InitialEvents | undefined {
  const element = typeof document === 'undefined' ? null : document.getElementById(ELEMENT_ID)
  if (!element?.textContent) return undefined
  element.remove() // uma vez só: as próximas navegações já têm os dados na query
  try {
    const data = JSON.parse(element.textContent) as InitialEvents
    return typeof data.generatedAt === 'string' && Array.isArray(data.page?.items) ? data : undefined
  } catch {
    return undefined
  }
}

/**
 * Põe a primeira janela do HTML na query do feed que começa em `startDate`, se ela for dessa janela e a
 * query ainda estiver vazia. Página antiga (dia diferente) ou outro ponto de partida: nada muda.
 */
export function seedInitialEvents(queryClient: QueryClient, startDate: IsoDate) {
  const initial = readInitialEvents()
  const { queryKey } = eventsInfiniteQueryOptions(startDate)
  if (!initial || initial.page.start !== startDate || queryClient.getQueryData(queryKey)) return
  queryClient.setQueryData(queryKey, { pages: [initial.page], pageParams: [startDate] }, { updatedAt: Date.parse(initial.generatedAt) })
}
