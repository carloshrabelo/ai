import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, ZoomControl } from 'react-leaflet'
import { genreColorClasses } from '../../components/ui/genreColors'
import type { DanceEvent } from '../../domain/event'
import { useResolvedTheme } from '../../theme/useResolvedTheme'
import { formatTimeRange } from '../events/format'
import type { Coords } from '../location/distance'
import { useUserLocation } from '../location/userLocation'

/** Centro de Lisboa, quando não há pinos. */
const LISBON: L.LatLngTuple = [38.7223, -9.1393]

// Tiles do OpenStreetMap: gratuitos e sem chave. No tema escuro, a classe `map-dark` inverte as cores
// (ver index.css), já que o OSM não tem versão escura sem chave.
const TILES_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

type Place = { key: string; name: string; coords: Coords; events: DanceEvent[] }

type Props = {
  events: DanceEvent[]
  onOpenEvent: (id: string) => void
}

/** Pinos dos eventos (um por local; vários eventos no mesmo local viram um pino com contador). */
export default function EventsMap({ events, onOpenEvent }: Props) {
  const theme = useResolvedTheme()
  const location = useUserLocation()
  const userCoords = location.status === 'granted' ? location.coords : undefined
  const places = useMemo(() => groupByPlace(events), [events])

  return (
    <MapContainer
      center={LISBON}
      zoom={11}
      zoomControl={false}
      className={`h-full w-full ${theme === 'dark' ? 'map-dark' : ''}`}
    >
      <TileLayer url={TILES_URL} attribution={ATTRIBUTION} maxZoom={19} />
      {/* Embaixo: em cima fica o resumo do dia. */}
      <ZoomControl position="bottomright" />
      {places.map((place) => (
        <Marker
          key={place.key}
          position={[place.coords.lat, place.coords.lng]}
          icon={pinIcon(place)}
          title={place.name}
          alt={place.name}
          eventHandlers={place.events.length === 1 ? { click: () => onOpenEvent(place.events[0].id) } : undefined}
        >
          {place.events.length > 1 && (
            <Popup>
              <p className="mb-1 font-semibold">{place.name}</p>
              <ul className="space-y-1">
                {place.events.map((event) => (
                  <li key={event.id}>
                    <button type="button" className="cursor-pointer text-left underline" onClick={() => onOpenEvent(event.id)}>
                      {event.title}
                    </button>{' '}
                    <span className="tabular-nums">· {formatTimeRange(event)}</span>
                  </li>
                ))}
              </ul>
            </Popup>
          )}
        </Marker>
      ))}
      {userCoords && (
        <CircleMarker
          center={[userCoords.lat, userCoords.lng]}
          radius={8}
          // "Você está aqui": anel azul com centro branco, diferente dos pinos de gênero.
          pathOptions={{ color: '#2563eb', weight: 4, fillColor: '#ffffff', fillOpacity: 1 }}
        />
      )}
      <FitBounds places={places} userCoords={userCoords} />
    </MapContainer>
  )
}

/** Enquadra os pinos (e a posição do usuário, se houver) sempre que mudam. */
function FitBounds({ places, userCoords }: { places: Place[]; userCoords?: Coords }) {
  const map = useMap()
  useEffect(() => {
    const points: L.LatLngTuple[] = places.map((place) => [place.coords.lat, place.coords.lng])
    if (userCoords) points.push([userCoords.lat, userCoords.lng])
    if (points.length === 0) map.setView(LISBON, 11)
    else if (points.length === 1) map.setView(points[0], 14)
    // Margem de cima maior: o resumo do dia fica por cima do mapa.
    else map.fitBounds(points, { paddingTopLeft: [40, 96], paddingBottomRight: [40, 40], maxZoom: 14 })
  }, [map, places, userCoords])
  return null
}

function groupByPlace(events: DanceEvent[]): Place[] {
  const byKey = new Map<string, Place>()
  for (const event of events) {
    const { venue } = event
    if (venue?.lat === undefined || venue.lng === undefined) continue
    const key = `${venue.lat},${venue.lng}`
    const place = byKey.get(key) ?? { key, name: venue.name, coords: { lat: venue.lat, lng: venue.lng }, events: [] }
    place.events.push(event)
    byKey.set(key, place)
  }
  return [...byKey.values()]
}

/** Pino redondo na cor do primeiro gênero do primeiro evento, com contador quando há mais de um. */
function pinIcon(place: Place): L.DivIcon {
  const colors = genreColorClasses(place.events[0].genres[0])
  const count = place.events.length > 1 ? place.events.length : ''
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `<span class="flex size-7 items-center justify-center rounded-full border-2 border-white text-xs font-semibold shadow-md ${colors}">${count}</span>`,
  })
}
