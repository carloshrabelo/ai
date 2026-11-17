// Lista os locais (campo `location`) dos próximos eventos da Google Calendar API que ainda não
// estão em src/data/venues.json. Esses eventos aparecem sem pino no mapa e sem distância.
//
// Uso: pnpm venues:check [dias] [--fix]   (padrão: 60 dias a partir de hoje)
//   --fix  busca as coordenadas dos locais que faltam no Nominatim (OpenStreetMap)
//          e grava em src/data/venues.json. Confira o resultado antes do commit.
// Lê VITE_GOOGLE_API_KEY do ambiente ou do .env.local.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const CALENDAR_ID = 'pasdedeux.pt@gmail.com'
const VENUES_FILE = 'src/data/venues.json'
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
  return line ? line.slice(line.indexOf('=') + 1).trim().replace(/^(['"])(.*)\1$/, '$2') : ''
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

// --fix: geocodifica no Nominatim (máx. 1 requisição por segundo, pela política de uso).
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function geocode(query) {
  await sleep(1100)
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: query, format: 'json', limit: '5', countrycodes: 'pt' })}`
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'lisbon-social-dance-venues/1.0' } })
    return response.ok ? await response.json() : []
  } catch {
    return [] // rede caiu ou o Nominatim limitou as requisições: tenta de novo mais tarde
  }
}

/** Código postal "1200-443" → região "12" (os 2 primeiros dígitos separam Lisboa, Cascais, Algarve…). */
const postalRegion = (text) => text.match(/\b(\d{2})\d{2}-\d{3}\b/)?.[1]

/** Região postal num resultado do Nominatim, que às vezes vem só com 4 dígitos ("…, Lisboa, 1600, Portugal"). */
const resultRegion = (label) => label.match(/,\s*(\d{2})\d{2}(?:-\d{3})?\s*,\s*Portugal$/)?.[1]

/** Primeiro resultado na mesma região postal do evento (quando os dois informam o código). */
function pick(hits, location) {
  const region = postalRegion(location)
  const hit = hits.find((h) => !region || !resultRegion(h.display_name) || resultRegion(h.display_name) === region)
  return hit && { lat: Number(Number(hit.lat).toFixed(6)), lng: Number(Number(hit.lon).toFixed(6)), label: hit.display_name }
}

/** Formas de buscar, da mais específica para a mais genérica. */
function queriesFor(location) {
  const parts = [...new Set(location.split(',').map((part) => part.trim()))] // remove partes repetidas
  const [name, ...rest] = parts
  const postal = rest.find((part) => postalRegion(part)) // "1200-443 Lisboa"
  const city = postal?.replace(/^\d{4}-\d{3}\s*/, '')
  const street = rest.find((part) => part !== postal && part !== 'Portugal')
  return [
    location,
    rest.length > 1 ? rest.join(', ') : undefined,
    street && postal ? `${street}, ${postal}` : undefined,
    street && city ? `${street.replace(/\s+\d+\w*(\s.*)?$/, '')}, ${city}` : undefined, // rua sem número
    city ? `${name}, ${city}` : `${name}, Portugal`,
  ].filter(Boolean)
}

console.log('\nGeocodificando…')
const notFound = []
for (const [location] of missing) {
  let hit
  for (const query of queriesFor(location)) {
    hit = pick(await geocode(query), location)
    if (hit) break
  }
  const name = location.split(',')[0].trim()
  if (!hit) {
    notFound.push(location)
    console.log(`  ✗ ${location}`)
    continue
  }
  venues[location] = { name, lat: hit.lat, lng: hit.lng }
  console.log(`  ✓ ${name} → ${hit.label}`)
}

const sorted = Object.fromEntries(Object.entries(venues).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(VENUES_FILE, `${JSON.stringify(sorted, null, 2)}\n`)
console.log(`\n${missing.length - notFound.length} adicionados em ${VENUES_FILE}; ${notFound.length} não encontrados.`)
process.exit(notFound.length > 0 ? 2 : 0)
