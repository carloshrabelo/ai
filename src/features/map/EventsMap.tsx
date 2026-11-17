import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useMemo, useRef } from 'react'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, ZoomControl } from 'react-leaflet'
import { genreColorClasses } from '../../components/ui/genreColors'
import type { DanceEvent } from '../../domain/event'
import { useResolvedTheme } from '../../theme/useResolvedTheme'
import { eventFocus, useEventFocus } from '../events/eventFocusStore'
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

/**
 * Pinos dos eventos (um por local; vários eventos no mesmo local viram um pino com contador).
 * Seleção e hover vêm do eventFocusStore (fonte única, compartilhada com a lista).
 */
export default function EventsMap({ events, onOpenEvent }: Props) {
  const theme = useResolvedTheme()
  const location = useUserLocation()
  const userCoords = location.status === 'granted' ? location.coords : undefined
  const places = useMemo(() => groupByPlace(events), [events])
  const selectedId = useEventFocus((state) => state.selectedId)
  const hover = useEventFocus((state) => state.hover)
  const selectedPlace = places.find((place) => place.events.some((event) => event.id === selectedId))

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

      {places.map((place) => {
        const ids = place.events.map((event) => event.id)
        const hovered = !!hover && hover.ids.some((id) => ids.includes(id))
        const state = place === selectedPlace ? 'selected' : hovered ? 'hovered' : 'normal'
        return (
          <Marker
            key={place.key}
            position={[place.coords.lat, place.coords.lng]}
            icon={pinIcon(place, state)}
            zIndexOffset={state === 'normal' ? 0 : 1000}
            alt={place.events.map((event) => event.title).join(', ')}
            eventHandlers={{
              mouseover: () => eventFocus.hover(ids, 'map'),
              mouseout: () => eventFocus.unhover('map'),
              click: () => {
                if (place.events.length === 1) onOpenEvent(place.events[0].id)
              },
            }}
          >
            {/* Título do evento (ou dos eventos do local) enquanto o pino ou o card estão em hover.
                Controlado pelo store: fecha junto com o hover, mesmo se o mouse "sumir" do pino. */}
            {hovered && (
            <Tooltip direction="top" offset={[0, -16]} permanent>
              {place.events.length === 1 ? (
                <span className="font-semibold">{place.events[0].title}</span>
              ) : (
                <span>
                  <span className="block font-semibold">{place.name}</span>
                  {place.events.map((event) => (
                    <span key={event.id} className="block">
                      {event.title}
                    </span>
                  ))}
                </span>
              )}
            </Tooltip>
            )}
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
        )
      })}

      {userCoords && (
        <CircleMarker
          center={[userCoords.lat, userCoords.lng]}
          radius={8}
          // "Você está aqui": anel azul com centro branco, diferente dos pinos de gênero.
          pathOptions={{ color: '#2563eb', weight: 4, fillColor: '#ffffff', fillOpacity: 1 }}
        />
      )}

      <InvalidateOnResize />
      {selectedPlace ? <FocusPlace place={selectedPlace} /> : <FitBounds places={places} userCoords={userCoords} />}
    </MapContainer>
  )
}

/** O mapa muda de altura quando os detalhes abrem embaixo dele: o Leaflet precisa recalcular. */
function InvalidateOnResize() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

/** Centra o mapa no local do evento aberto. */
function FocusPlace({ place }: { place: Place }) {
  const map = useMap()
  const { lat, lng } = place.coords
  useEffect(() => {
    // Espera o tamanho novo (detalhes abrindo) antes de centralizar.
    const frame = requestAnimationFrame(() => {
      map.invalidateSize()
      map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.6 })
    })
    return () => cancelAnimationFrame(frame)
  }, [map, lat, lng])
  return null
}

/** Enquadra os pinos (e a posição do usuário, se houver) sempre que mudam. */
function FitBounds({ places, userCoords }: { places: Place[]; userCoords?: Coords }) {
  const map = useMap()
  const first = useRef(true)
  useEffect(() => {
    const points: L.LatLngTuple[] = places.map((place) => [place.coords.lat, place.coords.lng])
    if (userCoords) points.push([userCoords.lat, userCoords.lng])
    const animate = !first.current
    first.current = false
    if (points.length === 0) map.setView(LISBON, 11, { animate })
    else if (points.length === 1) map.setView(points[0], 14, { animate })
    // Margem de cima maior: o resumo do dia fica por cima do mapa.
    else map.fitBounds(points, { paddingTopLeft: [40, 96], paddingBottomRight: [40, 40], maxZoom: 14, animate })
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
    if (!place.events.some((e) => e.id === event.id)) place.events.push(event)
    byKey.set(key, place)
  }
  return [...byKey.values()]
}

// Classes literais para o Tailwind gerar (o HTML do pino é uma string).
const PIN_STYLE = {
  normal: { size: 28, classes: 'size-7 border-2 border-white shadow-md' },
  hovered: { size: 36, classes: 'size-9 border-[3px] border-white shadow-lg ring-4 ring-brand/60' },
  selected: { size: 36, classes: 'size-9 border-[3px] border-white shadow-lg ring-4 ring-brand' },
} as const

// Mesmo ícone para o mesmo visual: trocar o ícone recria o elemento do pino embaixo do mouse.
const iconCache = new Map<string, L.DivIcon>()

/** Pino redondo na cor do primeiro gênero do primeiro evento, com contador quando há mais de um. */
function pinIcon(place: Place, state: keyof typeof PIN_STYLE): L.DivIcon {
  const { size, classes } = PIN_STYLE[state]
  const colors = genreColorClasses(place.events[0].genres[0])
  const count = place.events.length > 1 ? place.events.length : ''
  const cacheKey = `${state}|${colors}|${count}`
  const cached = iconCache.get(cacheKey)
  if (cached) return cached
  const icon = L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    tooltipAnchor: [0, 0],
    html: `<span class="flex items-center justify-center rounded-full text-xs font-semibold ${classes} ${colors}">${count}</span>`,
  })
  iconCache.set(cacheKey, icon)
  return icon
}
