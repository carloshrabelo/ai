import type { QueryClient } from '@tanstack/react-query'
import type { GCalEvent } from '../domain/gcal'
import { addDays, type IsoDate, lisbonMidnight } from '../lib/dates'
import { SWR_URL, WINDOW_DAYS } from './config'
import { itemsInWindow } from './eventsCache'
import { type EventsPage, eventsInfiniteQueryOptions } from './queries'

// Stale-while-revalidate da primeira janela: um cron (scripts/events-swr.ts, workflow "Update SWR")
// grava a cada 2 horas os eventos de ontem a 14 dias à frente em 3 arquivos de 5 dias, no branch
// `data` (servido por raw.githubusercontent.com). O app mostra esses eventos assim que chegam (mais
// novos que os do HTML do deploy) e a Google Calendar API, consultada ao mesmo tempo, atualiza.

/** Dias de cada arquivo e quantos arquivos: ontem + 14 dias (a 1ª janela da agenda, inclusive de madrugada). */
export const SWR_PART_DAYS = 5
export const SWR_PARTS = 3

/** Um arquivo: os eventos que tocam [start, end), dias de Lisboa. */
export type SwrPart = {
  generatedAt: string
  start: IsoDate
  end: IsoDate
  items: GCalEvent[]
}

/** Divide os eventos de `from` em diante nos arquivos do SWR (evento de vários dias entra em cada um que toca). */
export function splitSwrParts(items: readonly GCalEvent[], from: IsoDate, generatedAt: string): SwrPart[] {
  return Array.from({ length: SWR_PARTS }, (_, index) => {
    const start = addDays(from, index * SWR_PART_DAYS)
    const end = addDays(start, SWR_PART_DAYS)
    return { generatedAt, start, end, items: itemsInWindow(items, lisbonMidnight(start), lisbonMidnight(end)) }
  })
}

export function isSwrPart(value: unknown): value is SwrPart {
  const part = value as Partial<SwrPart> | null
  return (
    !!part &&
    typeof part.generatedAt === 'string' &&
    typeof part.start === 'string' &&
    typeof part.end === 'string' &&
    Array.isArray(part.items)
  )
}

/**
 * A janela [start, end) montada com os arquivos, se eles a cobrem inteira (contíguos e da mesma
 * geração). Sem repetidos, ordenada pelo início, como a da API.
 */
export function swrWindow(parts: readonly SwrPart[], start: IsoDate, end: IsoDate): (EventsPage & { generatedAt: string }) | undefined {
  const sorted = [...parts].sort((a, b) => a.start.localeCompare(b.start))
  const first = sorted[0]
  if (!first || first.start > start) return undefined
  let covered = first.start
  for (const part of sorted) {
    if (part.start > covered || part.generatedAt !== first.generatedAt) return undefined
    if (part.end > covered) covered = part.end
  }
  if (covered < end) return undefined

  const byId = new Map<string, GCalEvent>()
  for (const item of itemsInWindow(
    sorted.flatMap((part) => part.items),
    lisbonMidnight(start),
    lisbonMidnight(end),
  )) {
    if (!byId.has(item.id)) byId.set(item.id, item)
  }
  return { generatedAt: first.generatedAt, start, end, items: [...byId.values()] }
}

/** Os arquivos mudam a cada 2 horas: uma busca vale por 5 minutos (cada navegação até a agenda chama o loader). */
const FETCH_TTL_MS = 5 * 60_000
let fetched: { at: number; parts: Promise<SwrPart[]> } | undefined

function fetchParts(): Promise<SwrPart[]> {
  if (!fetched || Date.now() - fetched.at > FETCH_TTL_MS) {
    const parts = Promise.all(Array.from({ length: SWR_PARTS }, (_, index) => fetchPart(index))).then((all) =>
      all.filter((part) => part !== undefined),
    )
    fetched = { at: Date.now(), parts }
  }
  return fetched.parts
}

async function fetchPart(index: number): Promise<SwrPart | undefined> {
  try {
    const response = await fetch(`${SWR_URL}${index}.json`)
    if (!response.ok) return undefined
    const data: unknown = await response.json()
    return isSwrPart(data) ? data : undefined
  } catch {
    return undefined
  }
}

/**
 * Busca os arquivos do SWR e põe a janela que começa em `startDate` na query do feed, se eles a
 * cobrirem e forem mais novos que o que a query já tem (HTML do deploy, aparelho ou API). As outras
 * páginas já carregadas ficam. Sem SWR_URL (mock, dev) ou com falha: nada muda.
 */
export async function seedSwrEvents(queryClient: QueryClient, startDate: IsoDate): Promise<void> {
  if (!SWR_URL) return
  const page = swrWindow(await fetchParts(), startDate, addDays(startDate, WINDOW_DAYS))
  if (!page) return

  const { queryKey } = eventsInfiniteQueryOptions(startDate)
  const generatedAt = Date.parse(page.generatedAt)
  const state = queryClient.getQueryState(queryKey)
  if (state?.data && state.dataUpdatedAt >= generatedAt) return

  const { generatedAt: _, ...firstPage } = page
  const rest = state?.data?.pages.slice(1) ?? []
  const restParams = state?.data?.pageParams.slice(1) ?? []
  queryClient.setQueryData(queryKey, { pages: [firstPage, ...rest], pageParams: [startDate, ...restParams] }, { updatedAt: generatedAt })
}
