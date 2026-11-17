import { queryOptions, useQueries, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { DanceEvent, Venue } from '../../domain/event'
import { geocodeLocation } from './geocoding'

type Coords = { lat: number; lng: number }

/**
 * Coordenadas de um local que não está no venues.json, buscadas no Photon pelo navegador.
 * Resultado (inclusive "não achou") fica no cache e é salvo no aparelho pelo persister,
 * então cada local é buscado no máximo uma vez por aparelho. A Action diária grava os
 * locais no venues.json; daí em diante nem essa busca acontece.
 */
function geocodeQueryOptions(location: string) {
  return queryOptions({
    queryKey: ['geocode', location],
    queryFn: async ({ signal }): Promise<Coords | null> => {
      const hit = await geocodeLocation(location, { providers: ['photon'], signal })
      return hit ? { lat: hit.lat, lng: hit.lng } : null
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  })
}

const needsGeocoding = (venue?: Venue): venue is Venue & { location: string } =>
  !!venue?.location && (venue.lat === undefined || venue.lng === undefined)

const withCoords = (venue: Venue, coords: Coords | null | undefined): Venue =>
  coords ? { ...venue, lat: coords.lat, lng: coords.lng } : venue

// Fora do componente: com `combine` estável, o TanStack devolve o mesmo objeto enquanto nada muda.
function summarize(queries: { data?: Coords | null; isPending: boolean }[]) {
  return {
    coords: queries.map((query) => query.data),
    pending: queries.filter((query) => query.isPending).length,
  }
}

/** Eventos com as coordenadas que faltavam preenchidas. Mesma lista quando nada muda. */
export function useGeocodedEvents(events: DanceEvent[]): { events: DanceEvent[]; pending: number } {
  const locations = useMemo(
    () => [...new Set(events.flatMap((event) => (needsGeocoding(event.venue) ? [event.venue.location] : [])))],
    [events],
  )

  const results = useQueries({ queries: locations.map(geocodeQueryOptions), combine: summarize })

  const resolved = useMemo(() => {
    const byLocation = new Map(locations.map((location, i) => [location, results.coords[i]]))
    if (![...byLocation.values()].some(Boolean)) return events
    return events.map((event) => {
      const coords = needsGeocoding(event.venue) ? byLocation.get(event.venue.location) : undefined
      return coords && event.venue ? { ...event, venue: withCoords(event.venue, coords) } : event
    })
  }, [events, locations, results.coords])

  return { events: resolved, pending: results.pending }
}

/** Um local só (detalhes, distância). `enabled` evita buscar quando o resultado não é usado. */
export function useGeocodedVenue(venue: Venue | undefined, enabled = true): Venue | undefined {
  const { data } = useQuery({
    ...geocodeQueryOptions(venue?.location ?? ''),
    enabled: enabled && needsGeocoding(venue),
  })
  return venue && needsGeocoding(venue) ? withCoords(venue, data) : venue
}
