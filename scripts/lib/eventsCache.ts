// Cache dos eventos no disco (.cache/events.json): gerado por `pnpm events:cache` e lido pelos
// scripts (venues, promoters, prerender) no lugar da Google Calendar API. Formato e regras em
// src/api/eventsCache.ts.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { App } from './app.ts'
import { PUBLISHED_URL, root } from './app.ts'
import type { DatesModule, IsoDate, ScriptEvent } from './types.ts'

export const CACHE_PATH = join(root, '.cache', 'events.json')

/** Período do cache: de ontem (até as 05:00 a agenda ainda mostra a noite anterior) a 90 dias à frente. */
const DAYS_BEFORE = 1
const DAYS_AFTER = 90

/** Cache mais velho que isso é gerado de novo antes de ser usado. */
const MAX_AGE_HOURS = 6

type GCalEvent = { source?: string }
type EventsCache = { generatedAt: string; from: IsoDate; to: IsoDate; items: GCalEvent[] }

type CacheModule = {
  CACHE_FILE_NAME: string
  cacheItem: (item: GCalEvent) => GCalEvent
  eventsFromCache: (cache: EventsCache, from: IsoDate, to: IsoDate) => ScriptEvent[]
  cacheAgeHours: (cache: EventsCache) => number
  isEventsCache: (value: unknown) => value is EventsCache
}
type CalendarModule = {
  fetchCalendarItems: (source: string, params: { timeMin: Date; timeMax: Date }) => Promise<GCalEvent[]>
}
type SourcesModule = { CALENDAR_SOURCES: readonly string[] }

export function readCache(): EventsCache | undefined {
  if (!existsSync(CACHE_PATH)) return undefined
  try {
    const data: unknown = JSON.parse(readFileSync(CACHE_PATH, 'utf8'))
    const cache = data as EventsCache
    return typeof cache.generatedAt === 'string' && Array.isArray(cache.items) ? cache : undefined
  } catch {
    return undefined
  }
}

function writeCache(cache: EventsCache) {
  mkdirSync(dirname(CACHE_PATH), { recursive: true })
  writeFileSync(CACHE_PATH, `${JSON.stringify(cache)}\n`)
}

/**
 * Busca os três calendários na API e grava o cache. Se a API falhar, usa como base o cache publicado
 * no site (do último deploy) e, sem ele, o que já estava no disco. Lança só se não sobrar nenhum.
 */
export async function generateCache(app: App): Promise<{ cache: EventsCache; origin: 'api' | 'site' | 'disk' }> {
  const { addDays, lisbonMidnight, todayIso } = await app.load<DatesModule>('/src/lib/dates.ts')
  const { fetchCalendarItems } = await app.load<CalendarModule>('/src/api/googleCalendar.ts')
  const { CALENDAR_SOURCES } = await app.load<SourcesModule>('/src/domain/calendarSources.ts')
  const { CACHE_FILE_NAME, cacheItem, isEventsCache } = await app.load<CacheModule>('/src/api/eventsCache.ts')

  const today = todayIso()
  const from = addDays(today, -DAYS_BEFORE)
  const to = addDays(today, DAYS_AFTER)
  try {
    const params = { timeMin: lisbonMidnight(from), timeMax: lisbonMidnight(to) }
    // Todos ou nenhum: um calendário faltando apagaria os eventos dele de quem usa o cache.
    const perSource = await Promise.all(CALENDAR_SOURCES.map((source) => fetchCalendarItems(source, params)))
    const cache = { generatedAt: new Date().toISOString(), from, to, items: perSource.flat().map(cacheItem) }
    writeCache(cache)
    return { cache, origin: 'api' }
  } catch (error) {
    console.warn(`events:cache: Google Calendar API falhou (${error instanceof Error ? error.message : String(error)}).`)
  }

  try {
    const response = await fetch(`${PUBLISHED_URL}${CACHE_FILE_NAME}`)
    const data: unknown = response.ok ? await response.json() : undefined
    if (isEventsCache(data)) {
      writeCache(data)
      return { cache: data, origin: 'site' }
    }
  } catch {
    // sem rede ou sem cache publicado: tenta o do disco
  }
  const onDisk = readCache()
  if (onDisk) return { cache: onDisk, origin: 'disk' }
  throw new Error('sem a API, sem o cache publicado e sem cache no disco.')
}

/**
 * Eventos em [from, to) a partir do cache: usa o do disco se tiver menos de 6 horas; senão gera de
 * novo (API, ou o publicado no site como base).
 */
export async function loadCachedEvents(app: App, from: IsoDate, to: IsoDate): Promise<ScriptEvent[]> {
  const { eventsFromCache, cacheAgeHours } = await app.load<CacheModule>('/src/api/eventsCache.ts')
  let cache = readCache()
  if (!cache || cacheAgeHours(cache) > MAX_AGE_HOURS) {
    const generated = await generateCache(app)
    cache = generated.cache
    if (generated.origin !== 'api') console.warn(`Usando o cache de ${cache.generatedAt} (${generated.origin}).`)
  }
  return eventsFromCache(cache, from, to)
}
