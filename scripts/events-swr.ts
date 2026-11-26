// Gera os arquivos do SWR (src/api/swrEvents.ts): os três calendários de ontem a 14 dias à frente,
// direto da Google Calendar API, em 3 arquivos de 5 dias (0.json, 1.json, 2.json). O workflow
// "Update SWR" roda a cada 2 horas e publica a pasta no branch `data`.
//
// Uso: pnpm events:swr [pasta]     (padrão: .cache/swr)
// Saída: 1 se a API falhar (o workflow não publica, e fica o arquivo anterior).
// Lê VITE_GOOGLE_API_KEY do ambiente ou do .env.local.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { root, startApp } from './lib/app.ts'
import type { DatesModule, IsoDate } from './lib/types.ts'

type GCalEvent = { id: string }
type SwrPart = { generatedAt: string; start: IsoDate; end: IsoDate; items: GCalEvent[] }
type SwrModule = {
  SWR_PART_DAYS: number
  SWR_PARTS: number
  splitSwrParts: (items: readonly GCalEvent[], from: IsoDate, generatedAt: string) => SwrPart[]
}
type CacheModule = { cacheItem: (item: GCalEvent) => GCalEvent }
type CalendarModule = {
  fetchCalendarItems: (source: string, params: { timeMin: Date; timeMax: Date }) => Promise<GCalEvent[]>
}
type SourcesModule = { CALENDAR_SOURCES: readonly string[] }

const outDir = resolve(root, process.argv[2] ?? '.cache/swr')

const app = await startApp({ name: 'events-swr', realData: true })
try {
  const { addDays, lisbonMidnight, todayIso } = await app.load<DatesModule>('/src/lib/dates.ts')
  const { SWR_PART_DAYS, SWR_PARTS, splitSwrParts } = await app.load<SwrModule>('/src/api/swrEvents.ts')
  const { cacheItem } = await app.load<CacheModule>('/src/api/eventsCache.ts')
  const { fetchCalendarItems } = await app.load<CalendarModule>('/src/api/googleCalendar.ts')
  const { CALENDAR_SOURCES } = await app.load<SourcesModule>('/src/domain/calendarSources.ts')

  const from = addDays(todayIso(), -1)
  const to = addDays(from, SWR_PART_DAYS * SWR_PARTS)
  const params = { timeMin: lisbonMidnight(from), timeMax: lisbonMidnight(to) }
  // Todos ou nenhum: um calendário faltando sumiria com os eventos dele até a API responder.
  const perSource = await Promise.all(CALENDAR_SOURCES.map((source) => fetchCalendarItems(source, params)))
  const parts = splitSwrParts(perSource.flat().map(cacheItem), from, new Date().toISOString())

  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  parts.forEach((part, index) => writeFileSync(join(outDir, `${index}.json`), `${JSON.stringify(part)}\n`))
  const summary = parts.map((part, index) => `${index}.json ${part.start}–${part.end} (${part.items.length})`).join(', ')
  console.log(`events:swr: ${summary} → ${outDir}`)
} catch (error) {
  console.error(`events:swr: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  await app.close()
}
