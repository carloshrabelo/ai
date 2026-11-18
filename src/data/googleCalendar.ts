import { fromTangoLx, fromTradicionais, TANGO_CALENDAR_ID, TRADICIONAIS_CALENDAR_ID } from '../domain/calendarSources'
import { CALENDAR_ID, GOOGLE_API_KEY, MOCK_DELAY_MS, USE_MOCK } from './config'
import { lisbonMidnight, todayIso } from './dates'
import { shiftMockEvents } from './mockDates'

/** Início/fim de um evento: `date` para dia inteiro, `dateTime` para evento com hora. */
export type GCalDateTime = { date?: string; dateTime?: string; timeZone?: string }

/** Campos do evento da Google Calendar API v3 que o app usa. */
export type GCalEvent = {
  id: string
  status: string
  htmlLink: string
  summary?: string
  description?: string
  location?: string
  start: GCalDateTime
  end: GCalDateTime
  recurringEventId?: string
}

type GCalEventsResponse = {
  items?: GCalEvent[]
  nextPageToken?: string
}

export type FetchEventsParams = {
  timeMin: Date
  timeMax: Date
  signal?: AbortSignal
}

/**
 * Calendários lidos: o principal (pasdedeux.pt) e outros públicos, cada um com um adaptador que
 * converte o evento para o formato do principal (ver src/domain/calendarSources.ts).
 */
const SOURCES: { calendarId: string; adapt?: (event: GCalEvent) => GCalEvent }[] = [
  { calendarId: CALENDAR_ID },
  { calendarId: TRADICIONAIS_CALENDAR_ID, adapt: fromTradicionais },
  { calendarId: TANGO_CALENDAR_ID, adapt: fromTangoLx },
]

/** Eventos que se sobrepõem a [timeMin, timeMax), ordenados pelo início. */
export function fetchEvents(params: FetchEventsParams): Promise<GCalEvent[]> {
  return USE_MOCK ? fetchMockEvents(params) : fetchAllCalendars(params)
}

// ---------------------------------------------------------------------------
// API

/**
 * Todos os calendários em paralelo, juntos e ordenados pelo início. Se um calendário extra falhar,
 * a agenda segue com os outros; só o principal derruba a busca.
 */
async function fetchAllCalendars(params: FetchEventsParams): Promise<GCalEvent[]> {
  const results = await Promise.allSettled(
    SOURCES.map(async ({ calendarId, adapt }) => {
      const items = await fetchApiEvents(calendarId, params)
      return adapt ? items.map(adapt) : items
    }),
  )
  const [main] = results
  if (main.status === 'rejected') throw main.reason
  const items: GCalEvent[] = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') items.push(...result.value)
    else if (!params.signal?.aborted) console.warn(`Calendário ${SOURCES[index].calendarId} indisponível:`, result.reason)
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
  return items
    .filter((e) => endOf(e) > timeMin && startOf(e) < timeMax)
    .sort((a, b) => startOf(a).getTime() - startOf(b).getTime())
}

function startOf(event: GCalEvent): Date {
  return toDate(event.start)
}

function endOf(event: GCalEvent): Date {
  return toDate(event.end)
}

function toDate(value: GCalDateTime): Date {
  if (value.dateTime) return new Date(value.dateTime)
  return lisbonMidnight(value.date ?? '1970-01-01')
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
