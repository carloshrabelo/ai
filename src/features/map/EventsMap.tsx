import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { ScanIcon } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvent, ZoomControl } from 'react-leaflet'
import { genreColorClasses } from '../../components/ui/genreColors'
import type { DanceEvent } from '../../domain/event'
import { visibleGenres } from '../../domain/genres'
import { useResolvedTheme } from '../../theme/useResolvedTheme'
import { eventFocus, useEventFocus } from '../events/eventFocusStore'
import { formatTimeRange } from '../events/format'
import { useI18n } from '../../i18n/useI18n'
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
  onOpenEvent: (slug: string) => void
  /** Evento em foco, no lugar do aberto nos detalhes (página Mapa: o card visível no carrossel). */
  activeSlug?: string | null
  /** Espaço coberto por outros elementos em cima e embaixo do mapa, em px (enquadramento dos pinos). */
  inset?: { top: number; bottom: number }
  zoomPosition?: L.ControlPosition
  /**
   * Centrar o mapa no evento selecionado (padrão). Com `false` (página Mapa), o mapa fica sempre
   * enquadrado e a seleção só destaca o pino.
   */
  focusSelected?: boolean
}

const DEFAULT_INSET = { top: 96, bottom: 40 }

/**
 * Pinos dos eventos (um por local; vários eventos no mesmo local viram um pino com contador).
 * Seleção e hover vêm do eventFocusStore (fonte única, compartilhada com a lista).
 */
export default function EventsMap({
  events,
  onOpenEvent,
  activeSlug,
  inset = DEFAULT_INSET,
  zoomPosition = 'bottomright',
  focusSelected = true,
}: Props) {
  const { t } = useI18n()
  const theme = useResolvedTheme()
  const location = useUserLocation()
  const userCoords = location.status === 'granted' ? location.coords : undefined
  const places = useMemo(() => groupByPlace(events), [events])
  const selectedInStore = useEventFocus((state) => state.selectedSlug)
  const selectedSlug = activeSlug === undefined ? selectedInStore : activeSlug
  const selectedPlace = places.find((place) => place.events.some((event) => event.slug === selectedSlug))

  return (
    <MapContainer center={LISBON} zoom={11} zoomControl={false} className={`h-full w-full ${theme === 'dark' ? 'map-dark' : ''}`}>
      <TileLayer url={TILES_URL} attribution={ATTRIBUTION} maxZoom={19} />
      {/* Por padrão embaixo: em cima fica o resumo do dia. */}
      <ZoomControl position={zoomPosition} />
      <FitControl position={zoomPosition} label={t.map.fit} places={places} userCoords={userCoords} inset={inset} />

      <Pins places={places} selectedPlace={selectedPlace} onOpenEvent={onOpenEvent} />
      <OutsideControl
        places={places}
        userCoords={userCoords}
        inset={inset}
        position={zoomPosition.startsWith('top') ? 'topleft' : 'bottomleft'}
      />

      {userCoords && (
        <CircleMarker
          center={[userCoords.lat, userCoords.lng]}
          radius={8}
          // "Você está aqui": anel azul com centro branco, diferente dos pinos de gênero.
          pathOptions={{ color: '#2563eb', weight: 4, fillColor: '#ffffff', fillOpacity: 1 }}
        />
      )}

      <InvalidateOnResize />
      {focusSelected && selectedPlace ? (
        <FocusPlace place={selectedPlace} offsetY={(inset.bottom - inset.top) / 2} />
      ) : (
        <FitBounds places={places} userCoords={userCoords} inset={inset} />
      )}
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

/**
 * Centra o mapa no local do evento aberto. `offsetY` (px) desloca o centro para baixo quando há algo
 * cobrindo a parte de baixo do mapa (o pino fica no meio da área visível).
 */
function FocusPlace({ place, offsetY = 0 }: { place: Place; offsetY?: number }) {
  const map = useMap()
  const { lat, lng } = place.coords
  useEffect(() => {
    // Espera o tamanho novo (detalhes abrindo) antes de centralizar.
    const frame = requestAnimationFrame(() => {
      map.invalidateSize()
      const zoom = Math.max(map.getZoom(), 15)
      const center = map.unproject(map.project([lat, lng], zoom).add([0, offsetY]), zoom)
      map.flyTo(center, zoom, { duration: 0.6 })
    })
    return () => cancelAnimationFrame(frame)
  }, [map, lat, lng, offsetY])
  return null
}

type Inset = { top: number; bottom: number }

/** Distância (px na tela) abaixo da qual pinos de locais diferentes se juntam num grupo. */
const CLUSTER_PX = 34

type Cluster = { key: string; places: Place[] }

/** Agrupa locais muito próximos no zoom atual (guloso, na ordem: suficiente para dezenas de pinos). */
function clusterPlaces(places: Place[], map: L.Map, zoom: number): Cluster[] {
  const clusters: { key: string; places: Place[]; point: L.Point }[] = []
  for (const place of places) {
    const point = map.project([place.coords.lat, place.coords.lng], zoom)
    const near = clusters.find((cluster) => cluster.point.distanceTo(point) < CLUSTER_PX)
    if (near) near.places.push(place)
    else clusters.push({ key: place.key, places: [place], point })
  }
  return clusters
}

/**
 * Pinos: um por local; locais que se sobrepõem no zoom atual viram um pino de grupo com o total de
 * eventos, que aproxima o mapa ao ser tocado.
 */
function Pins({ places, selectedPlace, onOpenEvent }: { places: Place[]; selectedPlace?: Place; onOpenEvent: (slug: string) => void }) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  useMapEvent('zoomend', () => setZoom(map.getZoom()))
  const clusters = useMemo(() => clusterPlaces(places, map, zoom), [places, map, zoom])
  return clusters.map((cluster) =>
    cluster.places.length === 1 ? (
      <PlaceMarker key={cluster.key} place={cluster.places[0]} selected={cluster.places[0] === selectedPlace} onOpenEvent={onOpenEvent} />
    ) : (
      <ClusterMarker
        key={`cluster-${cluster.key}`}
        cluster={cluster}
        selected={!!selectedPlace && cluster.places.includes(selectedPlace)}
      />
    ),
  )
}

function ClusterMarker({ cluster, selected }: { cluster: Cluster; selected: boolean }) {
  const map = useMap()
  const { t } = useI18n()
  const total = cluster.places.reduce((sum, place) => sum + place.events.length, 0)
  const ids = cluster.places.flatMap((place) => place.events.map((event) => event.id))
  const hover = useEventFocus((state) => state.hover)
  const hovered = !!hover && hover.ids.some((id) => ids.includes(id))
  const first = cluster.places[0]
  const label = t.map.cluster(total)
  return (
    <Marker
      position={[first.coords.lat, first.coords.lng]}
      icon={clusterIcon(total, selected ? 'selected' : hovered ? 'hovered' : 'normal')}
      zIndexOffset={selected || hovered ? 1000 : 500}
      alt={label}
      eventHandlers={{
        add: (event) => {
          event.target.getElement()?.setAttribute('aria-label', label)
        },
        mouseover: () => eventFocus.hover(ids, 'map'),
        mouseout: () => eventFocus.unhover('map'),
        click: () => {
          const bounds = L.latLngBounds(cluster.places.map((place) => [place.coords.lat, place.coords.lng] as L.LatLngTuple))
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: Math.max(map.getZoom() + 2, 16) })
        },
      }}
    />
  )
}

function PlaceMarker({ place, selected, onOpenEvent }: { place: Place; selected: boolean; onOpenEvent: (slug: string) => void }) {
  const { t, locale } = useI18n()
  const hover = useEventFocus((state) => state.hover)
  const ids = place.events.map((event) => event.id)
  const hovered = !!hover && hover.ids.some((id) => ids.includes(id))
  const state = selected ? 'selected' : hovered ? 'hovered' : 'normal'
  return (
    <Marker
      key={place.key}
      position={[place.coords.lat, place.coords.lng]}
      icon={pinIcon(place, state)}
      zIndexOffset={state === 'normal' ? 0 : 1000}
      alt={place.events.map((event) => event.title).join(', ')}
      eventHandlers={{
        // O pino é um botão (role="button"): dá a ele o nome dos eventos para leitores de tela.
        add: (event) => {
          event.target.getElement()?.setAttribute('aria-label', t.map.pin(place.events.map((e) => e.title).join(', ')))
        },
        mouseover: () => eventFocus.hover(ids, 'map'),
        mouseout: () => eventFocus.unhover('map'),
        click: () => {
          if (place.events.length === 1) onOpenEvent(place.events[0].slug)
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
                <button type="button" className="cursor-pointer text-left underline" onClick={() => onOpenEvent(event.slug)}>
                  {event.title}
                </button>{' '}
                <span className="tabular-nums">· {formatTimeRange(event, locale)}</span>
              </li>
            ))}
          </ul>
        </Popup>
      )}
    </Marker>
  )
}

type FitProps = { places: Place[]; userCoords?: Coords; inset: Inset }

/** Região de Lisboa (Sintra/Cascais a Setúbal/Vila Franca): o enquadramento inicial fica nela. */
const LISBON_REGION = L.latLngBounds([38.45, -9.55], [39.05, -8.75])
const inLisbon = (place: Place) => LISBON_REGION.contains([place.coords.lat, place.coords.lng])

/**
 * Mostra os pinos (e a posição do usuário, se houver). Com `lisbonOnly`, se houver pinos na região de
 * Lisboa, enquadra só eles: um evento no Porto não encolhe todos os outros (ver OutsideControl).
 */
function fitAll(map: L.Map, { places, userCoords, inset }: FitProps, animate: boolean, lisbonOnly = false) {
  const local = places.filter(inLisbon)
  const shown = lisbonOnly && local.length > 0 ? local : places
  const points: L.LatLngTuple[] = shown.map((place) => [place.coords.lat, place.coords.lng])
  if (userCoords) points.push([userCoords.lat, userCoords.lng])
  if (points.length === 0) map.setView(LISBON, 11, { animate })
  else if (points.length === 1) map.setView(points[0], 14, { animate })
  // Margens maiores onde há algo por cima do mapa (resumo do dia, carrossel).
  else map.fitBounds(points, { paddingTopLeft: [40, inset.top], paddingBottomRight: [40, inset.bottom], maxZoom: 14, animate })
}

/** Enquadra os pinos sempre que mudam. */
function FitBounds({ places, userCoords, inset }: FitProps) {
  const map = useMap()
  const first = useRef(true)
  useEffect(() => {
    fitAll(map, { places, userCoords, inset: { top: inset.top, bottom: inset.bottom } }, !first.current, true)
    first.current = false
  }, [map, places, userCoords, inset.top, inset.bottom])
  return null
}

/** Botão "enquadrar" (junto do zoom, no visual dos controles do Leaflet, ver index.css): volta a mostrar todos os pinos. */
function FitControl({ position, label, ...fit }: FitProps & { position: L.ControlPosition; label: string }) {
  const map = useMap()
  // O React renderiza o botão dentro do contêiner do controle (portal).
  const container = useMemo(() => {
    const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control')
    L.DomEvent.disableClickPropagation(div)
    return div
  }, [])
  useEffect(() => {
    const control = new L.Control({ position })
    control.onAdd = () => container
    control.addTo(map)
    return () => {
      control.remove()
    }
  }, [map, position, container])
  return createPortal(
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        map.stop()
        fitAll(map, fit, true)
      }}
      className="flex size-9 cursor-pointer items-center justify-center bg-surface text-fg hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
    >
      <ScanIcon className="size-5" aria-hidden="true" />
    </button>,
    container,
  )
}

/** Chip "+N fora de Lisboa" (no canto oposto ao zoom): enquadra todos os pinos, inclusive os de fora. */
function OutsideControl({ position, ...fit }: FitProps & { position: L.ControlPosition }) {
  const map = useMap()
  const { t } = useI18n()
  const outside = fit.places.filter((place) => !inLisbon(place)).length
  const hasLocal = fit.places.some(inLisbon)
  const container = useMemo(() => {
    const div = L.DomUtil.create('div', 'leaflet-control')
    L.DomEvent.disableClickPropagation(div)
    return div
  }, [])
  const visible = outside > 0 && hasLocal
  useEffect(() => {
    if (!visible) return
    const control = new L.Control({ position })
    control.onAdd = () => container
    control.addTo(map)
    return () => {
      control.remove()
    }
  }, [map, container, visible, position])
  if (!visible) return null
  return createPortal(
    <button
      type="button"
      onClick={() => {
        map.stop()
        fitAll(map, fit, true)
      }}
      className="inline-flex h-9 cursor-pointer items-center rounded-xl border-2 border-b-4 border-border bg-surface px-3 text-xs font-bold text-fg hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
    >
      {t.map.outside(outside)}
    </button>,
    container,
  )
}

function groupByPlace(events: DanceEvent[]): Place[] {
  const byKey = new Map<string, Place>()
  for (const event of events) {
    const { venue } = event
    if (venue?.lat === undefined || venue.lng === undefined) continue
    // Cancelado ou adiado não acontece ali naquela data: fica fora do mapa.
    if (event.status) continue
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

/** Pino de grupo: roxo da marca, maior, com o total de eventos. */
function clusterIcon(total: number, state: keyof typeof PIN_STYLE): L.DivIcon {
  const ring = state === 'selected' ? 'ring-4 ring-brand' : state === 'hovered' ? 'ring-4 ring-brand/60' : ''
  const cacheKey = `cluster|${state}|${total}`
  const cached = iconCache.get(cacheKey)
  if (cached) return cached
  const icon = L.divIcon({
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `<span class="flex size-10 items-center justify-center rounded-full border-[3px] border-white bg-brand text-sm font-bold text-brand-fg shadow-lg ${ring}">${total}</span>`,
  })
  iconCache.set(cacheKey, icon)
  return icon
}

/** Pino redondo na cor do primeiro gênero do primeiro evento, com contador quando há mais de um. */
function pinIcon(place: Place, state: keyof typeof PIN_STYLE): L.DivIcon {
  const { size, classes } = PIN_STYLE[state]
  const colors = genreColorClasses(visibleGenres(place.events[0].genres)[0])
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
