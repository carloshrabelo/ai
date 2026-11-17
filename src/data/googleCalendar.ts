import { CALENDAR_ID, GOOGLE_API_KEY, MOCK_DELAY_MS, USE_MOCK } from './config'
import { type IsoDate, lisbonMidnight, todayIso } from './dates'

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

const API_URL = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`

/** Eventos que se sobrepõem a [timeMin, timeMax), ordenados pelo início. */
export function fetchEvents(params: FetchEventsParams): Promise<GCalEvent[]> {
  return USE_MOCK ? fetchMockEvents(params) : fetchApiEvents(params)
}

/** Data inicial padrão do feed: hoje com a API; o primeiro evento do arquivo com o mock. */
export async function getDefaultStartDate(): Promise<IsoDate> {
  if (!USE_MOCK) return todayIso()
  const items = await loadMockItems()
  const first = items.map(startOf).sort((a, b) => a.getTime() - b.getTime())[0]
  return first ? todayIso(first) : todayIso()
}

// ---------------------------------------------------------------------------
// API

async function fetchApiEvents({ timeMin, timeMax, signal }: FetchEventsParams): Promise<GCalEvent[]> {
  const items: GCalEvent[] = []
  let pageToken: string | undefined

  // A API pagina dentro da janela: segue o nextPageToken até o fim.
  do {
    const url = new URL(API_URL)
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

async function loadMockItems(): Promise<GCalEvent[]> {
  const mock = await import('../mocks/events.json')
  return mock.default.items as GCalEvent[]
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
