// Lista os locais (campo `location`) dos próximos eventos da Google Calendar API que ainda não
// estão em src/content/venues.json. Esses eventos aparecem sem pino no mapa e sem distância.
//
// Uso: pnpm venues:check [dias] [--fix]   (padrão: 60 dias a partir de hoje)
//   --fix  busca as coordenadas dos locais que faltam (Nominatim e Photon, dados do OpenStreetMap)
//          e grava em src/content/venues.json. Roda todo dia na Action "Update venues".
// Saída: 2 quando faltam locais (sem --fix); 0 com --fix, mesmo que alguns não sejam encontrados.
// Lê VITE_GOOGLE_API_KEY do ambiente ou do .env.local.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { geocodeLocation } from '../src/features/location/geocoding.ts'

const CALENDAR_ID = 'pasdedeux.pt@gmail.com'
const VENUES_FILE = 'src/content/venues.json'
const args = process.argv.slice(2)
const fix = args.includes('--fix')
const days = Number(args.find((arg) => /^\d+$/.test(arg))) || 60

function readEnvLocal(name) {
  if (process.env[name]) return process.env[name]
  if (!existsSync('.env.local')) return ''
  const line = readFileSync('.env.local', 'utf8')
    .split('\n')
    .find((l) => l.trim().startsWith(`${name}=`))
  // Aceita valor entre aspas, como o Vite.
  return line
    ? line
        .slice(line.indexOf('=') + 1)
        .trim()
        .replace(/^(['"])(.*)\1$/, '$2')
    : ''
}

const key = readEnvLocal('VITE_GOOGLE_API_KEY')
if (!key) {
  console.error('VITE_GOOGLE_API_KEY não encontrada (ambiente ou .env.local).')
  process.exit(1)
}

const timeMin = new Date()
const timeMax = new Date(timeMin.getTime() + days * 86_400_000)
const locations = new Map() // location → nº de eventos
let pageToken

do {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`)
  url.search = new URLSearchParams({
    key,
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: '250',
    ...(pageToken ? { pageToken } : {}),
  }).toString()

  // A chave é restrita por HTTP referrer: manda o domínio publicado como referrer.
  const response = await fetch(url, { headers: { Referer: 'https://carloshrabelo.github.io/ai/' } })
  if (!response.ok) {
    console.error(`Falha na API (HTTP ${response.status}): ${(await response.text()).slice(0, 300)}`)
    process.exit(1)
  }
  const data = await response.json()
  for (const event of data.items ?? []) {
    if (event.status === 'cancelled' || !event.location) continue
    locations.set(event.location, (locations.get(event.location) ?? 0) + 1)
  }
  pageToken = data.nextPageToken
} while (pageToken)

const venues = JSON.parse(readFileSync(VENUES_FILE, 'utf8'))
const missing = [...locations].filter(([location]) => !venues[location]).sort((a, b) => b[1] - a[1])

console.log(`${locations.size} locais nos próximos ${days} dias; ${missing.length} sem coordenadas em ${VENUES_FILE}.`)
for (const [location, count] of missing) console.log(`  (${count}×) ${location}`)

if (!fix || missing.length === 0) process.exit(missing.length > 0 ? 2 : 0)

// --fix: para cada consulta, Nominatim e depois Photon (ver src/features/location/geocoding.ts).
console.log('\nGeocodificando…')
const notFound = []
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
console.log(`\n${missing.length - notFound.length} adicionados em ${VENUES_FILE}; ${notFound.length} não encontrados.`)
// Com --fix, não encontrar alguns locais não é erro (a Action diária tenta de novo amanhã).
