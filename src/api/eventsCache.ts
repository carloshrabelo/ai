import { type DanceEvent, toDanceEvent } from '../domain/event'
import type { GCalDateTime, GCalEvent } from '../domain/gcal'
import { type IsoDate, lisbonMidnight } from '../lib/dates'

// Cache dos eventos (scripts/events-cache.ts): os três calendários de 30 dias atrás a 90 à frente,
// já adaptados (com `source`), gerado uma vez por dia. Os scripts (venues, promoters, prerender)
// partem dele em vez de chamar a API, e o build o publica como /events-cache.json: o app o usa
// quando a Google Calendar API falha.

export type EventsCache = {
  /** Quando foi gerado (ISO). */
  generatedAt: string
  /** Período coberto, [from, to), em dias de Lisboa. */
  from: IsoDate
  to: IsoDate
  items: GCalEvent[]
}

/**
 * Só os campos que o app usa (o cache é publicado: nada de `creator`/`organizer`, que trazem e-mails).
 */
export function cacheItem(item: GCalEvent): GCalEvent {
  const { id, status, htmlLink, summary, description, location, start, end, recurringEventId, updated, source } = item
  return { id, status, htmlLink, summary, description, location, start, end, recurringEventId, updated, source }
}

/** Nome do arquivo publicado (relativo ao BASE_URL do app). */
export const CACHE_FILE_NAME = 'events-cache.json'

const DAY_MS = 24 * 60 * 60_000

export const startOf = (event: GCalEvent) => toDate(event.start)
const endOf = (event: GCalEvent) => toDate(event.end)

function toDate(value: GCalDateTime): Date {
  if (value.dateTime) return new Date(value.dateTime)
  return lisbonMidnight(value.date ?? '1970-01-01')
}

/** Mesma regra da API: termina depois de timeMin e começa antes de timeMax. Ordenados pelo início. */
export function itemsInWindow(items: readonly GCalEvent[], timeMin: Date, timeMax: Date): GCalEvent[] {
  return items
    .filter((item) => endOf(item) > timeMin && startOf(item) < timeMax)
    .sort((a, b) => startOf(a).getTime() - startOf(b).getTime())
}

/** Eventos do cache em [from, to), sem repetidos e ordenados pelo início (como loadEvents). */
export function eventsFromCache(cache: EventsCache, from: IsoDate, to: IsoDate): DanceEvent[] {
  const byId = new Map<string, DanceEvent>()
  for (const item of itemsInWindow(cache.items, lisbonMidnight(from), lisbonMidnight(to))) {
    if (!byId.has(item.id)) byId.set(item.id, toDanceEvent(item))
  }
  return [...byId.values()]
}

/** Idade do cache em horas. */
export const cacheAgeHours = (cache: EventsCache, now = Date.now()) => (now - Date.parse(cache.generatedAt)) / (DAY_MS / 24)

/** Formato mínimo válido (o arquivo vem da rede ou do disco). */
export function isEventsCache(value: unknown): value is EventsCache {
  const cache = value as Partial<EventsCache> | null
  return !!cache && typeof cache.generatedAt === 'string' && typeof cache.from === 'string' && Array.isArray(cache.items)
}

let published: Promise<EventsCache | undefined> | undefined

/**
 * Cache publicado com o site (/events-cache.json), buscado uma vez por sessão e só quando a API
 * falha. undefined se não existir (dev, mock) ou não carregar.
 */
export function fetchPublishedCache(): Promise<EventsCache | undefined> {
  published ??= fetch(`${import.meta.env.BASE_URL}${CACHE_FILE_NAME}`)
    .then(async (response) => {
      if (!response.ok) return undefined
      const data: unknown = await response.json()
      return isEventsCache(data) ? data : undefined
    })
    .catch(() => undefined)
    .then((cache) => {
      if (!cache) published = undefined // tenta de novo na próxima falha
      return cache
    })
  return published
}
