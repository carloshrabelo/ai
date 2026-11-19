// Lista os locais (campo `location`) dos próximos eventos que ainda não estão em
// src/content/venues.json. Esses eventos aparecem sem pino no mapa e sem distância. Lê os mesmos
// calendários do app (principal, tango e danças tradicionais), já com os adaptadores: o local do
// tango vem da descrição ("Where: …") e o das danças tradicionais leva a cidade.
//
// Uso: pnpm venues:check [dias] [--fix]   (padrão: 60 dias a partir de hoje)
//   --fix  busca as coordenadas dos locais que faltam (Nominatim e Photon, dados do OpenStreetMap)
//          e grava em src/content/venues.json. Roda todo dia na Action "Update venues".
// Saída: 2 quando faltam locais (sem --fix); 0 com --fix, mesmo que alguns não sejam encontrados.
// Lê VITE_GOOGLE_API_KEY do ambiente ou do .env.local.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { geocodeLocation } from '../src/features/location/geocoding.ts'
import { root, startApp } from './lib/app.ts'
import type { DatesModule, LoadEventsModule } from './lib/types.ts'

type Venues = Record<string, { name: string; lat: number; lng: number }>

const VENUES_FILE = join(root, 'src/content/venues.json')
const args = process.argv.slice(2)
const fix = args.includes('--fix')
const days = Number(args.find((arg) => /^\d+$/.test(arg))) || 60

const locations = new Map<string, number>() // location → nº de eventos
const app = await startApp({ name: 'venues', realData: true })
try {
  const { GOOGLE_API_KEY } = await app.load<{ GOOGLE_API_KEY: string }>('/src/api/config.ts')
  if (!GOOGLE_API_KEY) throw new Error('VITE_GOOGLE_API_KEY não encontrada (ambiente ou .env.local).')
  const { loadEvents } = await app.load<LoadEventsModule>('/src/api/loadEvents.ts')
  const { addDays, todayIso } = await app.load<DatesModule>('/src/lib/dates.ts')
  const today = todayIso()
  for (const event of await loadEvents(today, addDays(today, days))) {
    const location = event.venue?.location
    if (location) locations.set(location, (locations.get(location) ?? 0) + 1)
  }
} catch (error) {
  console.error(`venues:check: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
} finally {
  await app.close()
}

const venues = JSON.parse(readFileSync(VENUES_FILE, 'utf8')) as Venues
const missing = [...locations].filter(([location]) => !venues[location]).sort((a, b) => b[1] - a[1])

console.log(`${locations.size} locais nos próximos ${days} dias; ${missing.length} sem coordenadas em src/content/venues.json.`)
for (const [location, count] of missing) console.log(`  (${count}×) ${location}`)

if (!fix || missing.length === 0) process.exit(missing.length > 0 ? 2 : 0)

// --fix: para cada consulta, Nominatim e depois Photon (ver src/features/location/geocoding.ts).
console.log('\nGeocodificando…')
const notFound: string[] = []
for (const [location] of missing) {
  const hit = await geocodeLocation(location, {
    providers: ['nominatim', 'photon'],
    userAgent: 'lisbon-social-dance-venues/1.0',
  })
  const name = location.split(',')[0].trim()
  if (!hit) {
    notFound.push(location)
    console.log(`  ✗ ${location}`)
    continue
  }
  venues[location] = { name, lat: hit.lat, lng: hit.lng }
  console.log(`  ✓ [${hit.provider}] ${name} → ${hit.label}`)
}

const sorted = Object.fromEntries(Object.entries(venues).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(VENUES_FILE, `${JSON.stringify(sorted, null, 2)}\n`)
console.log(`\n${missing.length - notFound.length} adicionados em src/content/venues.json; ${notFound.length} não encontrados.`)
// Com --fix, não encontrar alguns locais não é erro (a Action diária tenta de novo amanhã).
