import { CALENDAR_SOURCES, CALENDARS, type CalendarSource } from '../domain/calendarSources'
import type { GCalEvent } from '../domain/gcal'
import { GOOGLE_API_KEY, MOCK_DELAY_MS, USE_MOCK } from './config'
import { fetchPublishedCache, itemsInWindow, startOf } from './eventsCache'
import { todayIso } from '../lib/dates'
import { shiftMockEvents } from './mockDates'

type GCalEventsResponse = {
  items?: GCalEvent[]
  nextPageToken?: string
}

export type FetchEventsParams = {
  timeMin: Date
  timeMax: Date
  signal?: AbortSignal
}

/** Calendários lidos (ids e adaptadores em src/domain/calendarSources.ts). */
const SOURCES = CALENDAR_SOURCES.map((source) => ({ source, ...CALENDARS[source] }))

/** Eventos que se sobrepõem a [timeMin, timeMax), ordenados pelo início. */
export function fetchEvents(params: FetchEventsParams): Promise<GCalEvent[]> {
  return USE_MOCK ? fetchMockEvents(params) : fetchAllCalendars(params)
}

// ---------------------------------------------------------------------------
// API

/**
 * Todos os calendários em paralelo, juntos e ordenados pelo início. O calendário que falhar entra
 * pelo cache publicado (/events-cache.json, ver eventsCache.ts); sem cache, um extra que falha fica
 * de fora e o principal derruba a busca.
 */
async function fetchAllCalendars(params: FetchEventsParams): Promise<GCalEvent[]> {
  const results = await Promise.allSettled(SOURCES.map(({ source }) => fetchCalendarItems(source, params)))
  const failed = results.some((result) => result.status === 'rejected')
  const cache = failed && !params.signal?.aborted ? await fetchPublishedCache() : undefined
  return mergeCalendarResults(results, cache?.items, params)
}

/** Eventos de um calendário, já adaptados ao formato do principal e com `source`. */
export async function fetchCalendarItems(source: CalendarSource, params: FetchEventsParams): Promise<GCalEvent[]> {
  const { calendarId, adapt } = CALENDARS[source]
  const items = await fetchApiEvents(calendarId, params)
  return items.map((item) => ({ ...(adapt ? adapt(item) : item), source }))
}

/**
 * Junta o resultado de cada calendário (na ordem de SOURCES). Quem falhou entra pelos itens do cache
 * daquele calendário na janela; sem cache, um extra fica de fora e o principal lança o erro.
 */
export function mergeCalendarResults(
  results: readonly PromiseSettledResult<GCalEvent[]>[],
  cached: readonly GCalEvent[] | undefined,
  { timeMin, timeMax, signal }: FetchEventsParams,
): GCalEvent[] {
  const items: GCalEvent[] = []
  results.forEach((result, index) => {
    const { source, calendarId } = SOURCES[index]
    if (result.status === 'fulfilled') {
      items.push(...result.value)
      return
    }
    if (cached) {
      if (!signal?.aborted) console.warn(`Calendário ${calendarId} indisponível; usando o cache.`, result.reason)
      items.push(...itemsInWindow(cached, timeMin, timeMax).filter((item) => (item.source ?? 'pasdedeux') === source))
      return
    }
    if (index === 0) throw result.reason
    if (!signal?.aborted) console.warn(`Calendário ${calendarId} indisponível:`, result.reason)
  })
  return items.sort((a, b) => startOf(a).getTime() - startOf(b).getTime())
}

async function fetchApiEvents(calendarId: string, { timeMin, timeMax, signal }: FetchEventsParams): Promise<GCalEvent[]> {
  const items: GCalEvent[] = []
  let pageToken: string | undefined

  // A API pagina dentro da janela: segue o nextPageToken até o fim.
  do {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`)
    url.search = new URLSearchParams({
      key: GOOGLE_API_KEY,
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: '250',
      ...(pageToken ? { pageToken } : {}),
    }).toString()

    const response = await fetch(url, { signal })
    if (!response.ok) {
      throw new Error(`Falha ao buscar eventos (HTTP ${response.status}).`)
    }
    const data = (await response.json()) as GCalEventsResponse
    items.push(...(data.items ?? []))
    pageToken = data.nextPageToken
  } while (pageToken)

  return items.filter((e) => e.status !== 'cancelled')
}

// ---------------------------------------------------------------------------
// Mock

/** Eventos do mock com as datas deslocadas para perto de hoje (ver shiftMockEvents). */
async function loadMockItems(): Promise<GCalEvent[]> {
  const mock = await import('../mocks/events.json')
  return shiftMockEvents(mock.default.items as GCalEvent[], todayIso())
}

async function fetchMockEvents({ timeMin, timeMax, signal }: FetchEventsParams): Promise<GCalEvent[]> {
  const items = await loadMockItems()
  if (MOCK_DELAY_MS) await delay(MOCK_DELAY_MS, signal)

  // Mesma regra da API: termina depois de timeMin e começa antes de timeMax.
  return itemsInWindow(items, timeMin, timeMax)
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })
}
