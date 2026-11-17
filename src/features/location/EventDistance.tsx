import { Skeleton } from '../../components/ui/Skeleton'
import type { Venue } from '../../domain/event'
import { distanceKm, formatDistance } from './distance'
import { useGeocodedVenue } from './useGeocodedEvents'
import { useUserLocation } from './userLocation'
import { useI18n } from '../../i18n/useI18n'

/** Distância até o local do evento. Só aparece com localização liberada e local com coordenadas. */
export function EventDistance({ venue: original }: { venue?: Venue }) {
  const { t, locale } = useI18n()
  const location = useUserLocation()
  // Só busca coordenadas de local desconhecido quando a distância vai aparecer.
  const venue = useGeocodedVenue(original, location.status === 'granted')
  if (venue?.lat === undefined || venue.lng === undefined) return null
  if (location.status === 'pending') return <Skeleton rounded="rounded-full" className="h-4 w-12" />
  if (location.status !== 'granted') return null

  const km = distanceKm(location.coords, { lat: venue.lat, lng: venue.lng })
  return (
    <span className="shrink-0 text-xs font-medium whitespace-nowrap text-fg-muted tabular-nums">
      <span className="sr-only">{t.event.distance}: </span>
      {formatDistance(km, locale)}
    </span>
  )
}
