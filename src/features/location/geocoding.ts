// Geocodificação do texto de `location` dos eventos → coordenadas, com dados do OpenStreetMap.
//
// Arquivo autocontido (sem imports relativos, só sintaxe TS apagável): é usado pelo app no
// navegador e pelo script `scripts/venues-check.mjs` no Node (que roda .ts direto).
//
// Provedores:
// - Nominatim: bom para endereços; a política de uso pede no máx. 1 requisição/s e desaconselha
//   chamadas de cada visitante, então só o script usa.
// - Photon (komoot): tolerante com nomes de estabelecimentos, com CORS; usado no navegador e como
//   segunda tentativa no script.

type GeoProvider = 'nominatim' | 'photon'

export type GeoHit = {
  lat: number
  lng: number
  label: string
  /** Código postal do resultado, quando o provedor informa (ex.: "1200-479" ou "1600"). */
  postcode?: string
  provider: GeoProvider
}

export type GeocodeOptions = {
  providers?: readonly GeoProvider[]
  signal?: AbortSignal
  fetch?: typeof fetch
  /** Identificação nos pedidos (o navegador não deixa mudar o User-Agent; o Node sim). */
  userAgent?: string
}

/** Portugal continental + ilhas próximas (minLon, minLat, maxLon, maxLat). */
const PORTUGAL_BBOX = '-9.6,36.9,-6.1,42.2'

/** Intervalo mínimo entre pedidos ao mesmo provedor. */
const MIN_INTERVAL_MS: Record<GeoProvider, number> = { nominatim: 1100, photon: 300 }

// ---------------------------------------------------------------------------
// Consultas e validação

/** "1200-443 Lisboa" → "12" (os 2 primeiros dígitos separam Lisboa, Cascais, Algarve…). */
function postalRegion(text: string): string | undefined {
  return text.match(/\b(\d{2})\d{2}-\d{3}\b/)?.[1]
}

/** Região de um código postal de resultado, que às vezes vem só com 4 dígitos ("1600"). */
function hitRegion(postcode: string | undefined): string | undefined {
  return postcode?.match(/^(\d{2})\d{2}(?:-\d{3})?$/)?.[1]
}

/** O resultado está na mesma região postal do evento? (Sem código de um dos lados, aceita.) */
export function sameRegion(location: string, hit: Pick<GeoHit, 'postcode'>): boolean {
  const expected = postalRegion(location)
  const actual = hitRegion(hit.postcode)
  return !expected || !actual || expected === actual
}

const STREET = /^(r\.|rua|av\.|avenida|largo|lg\.|praça|pç\.|travessa|tv\.|estrada|alameda|calçada|beco)\s/i

/** Formas de buscar um `location`, da mais específica para a mais genérica. */
export function queriesFor(location: string): string[] {
  const parts = [
    ...new Set(
      location
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ] // sem partes repetidas
  const [name = '', ...rest] = parts
  const postal = rest.find((part) => postalRegion(part)) // "1200-443 Lisboa"
  const city = postal?.replace(/^\d{4}-\d{3}\s*/, '')
  // Sem rua separada, o próprio "nome" pode ser o endereço ("R. Serpa Pinto 19, 1200-443 Lisboa").
  const street = rest.find((part) => part !== postal && part !== 'Portugal') ?? (STREET.test(name) ? name : undefined)
  const queries = [
    location,
    rest.length > 1 ? rest.join(', ') : undefined,
    street && postal ? `${street}, ${postal}` : undefined,
    street && city ? `${street.replace(/\s+\d+\w*(\s.*)?$/, '')}, ${city}` : undefined, // rua sem número
    city ? `${name}, ${city}` : `${name}, Portugal`,
  ]
  return [...new Set(queries.filter((query): query is string => !!query))]
}

// ---------------------------------------------------------------------------
// Provedores

type NominatimResult = { lat: string; lon: string; display_name: string }
type PhotonFeature = {
  geometry: { coordinates: [number, number] }
  properties: { name?: string; street?: string; housenumber?: string; postcode?: string; city?: string }
}

export function parseNominatim(results: NominatimResult[]): GeoHit[] {
  return results.map((result) => ({
    lat: round(Number(result.lat)),
    lng: round(Number(result.lon)),
    label: result.display_name,
    // O código postal vem no texto: "…, Lisboa, 1200-479, Portugal"
    postcode: result.display_name.match(/,\s*(\d{4}(?:-\d{3})?)\s*,\s*Portugal$/)?.[1],
    provider: 'nominatim',
  }))
}

export function parsePhoton(data: { features?: PhotonFeature[] }): GeoHit[] {
  return (data.features ?? []).map(({ geometry, properties }) => ({
    lat: round(geometry.coordinates[1]),
    lng: round(geometry.coordinates[0]),
    label: [properties.name, [properties.street, properties.housenumber].filter(Boolean).join(' '), properties.postcode, properties.city]
      .filter(Boolean)
      .join(', '),
    postcode: properties.postcode,
    provider: 'photon',
  }))
}

const round = (value: number) => Number(value.toFixed(6))

// Fila por provedor: um pedido de cada vez, com intervalo mínimo entre eles.
const queues: Record<GeoProvider, Promise<unknown>> = { nominatim: Promise.resolve(), photon: Promise.resolve() }

function throttled<T>(provider: GeoProvider, task: () => Promise<T>): Promise<T> {
  const run = queues[provider].then(task)
  queues[provider] = run.catch(() => {}).then(() => new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS[provider])))
  return run
}

async function search(provider: GeoProvider, query: string, options: GeocodeOptions): Promise<GeoHit[]> {
  const doFetch = options.fetch ?? fetch
  const headers = options.userAgent ? { 'User-Agent': options.userAgent } : undefined
  const url =
    provider === 'nominatim'
      ? `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: query, format: 'json', limit: '5', countrycodes: 'pt' })}`
      : `https://photon.komoot.io/api/?${new URLSearchParams({ q: query, limit: '5', bbox: PORTUGAL_BBOX })}`

  return throttled(provider, async () => {
    options.signal?.throwIfAborted()
    try {
      const response = await doFetch(url, { headers, signal: options.signal })
      if (!response.ok) return []
      // Formato de cada provedor; o parser ignora o que não reconhece.
      const data: unknown = await response.json()
      return provider === 'nominatim' ? parseNominatim(data as NominatimResult[]) : parsePhoton(data as { features?: PhotonFeature[] })
    } catch (error) {
      if (options.signal?.aborted) throw error
      return [] // rede caiu ou o provedor limitou: segue para a próxima tentativa
    }
  })
}

/**
 * Coordenadas de um `location`: tenta cada consulta em cada provedor (na ordem dada) e devolve o
 * primeiro resultado na mesma região postal do evento, ou null.
 */
export async function geocodeLocation(location: string, options: GeocodeOptions = {}): Promise<GeoHit | null> {
  const providers = options.providers ?? ['photon']
  for (const query of queriesFor(location)) {
    for (const provider of providers) {
      const hit = (await search(provider, query, options)).find((candidate) => sameRegion(location, candidate))
      if (hit) return hit
    }
  }
  return null
}
