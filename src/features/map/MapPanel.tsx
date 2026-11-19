import { lazy, Suspense, useMemo } from 'react'
import { type IsoDate, lisbonDate } from '../../lib/dates'
import type { GenreFilterValue } from '../../domain/genreFilter'
import { formatDayHeading, formatTimeRange } from '../events/format'
import { useDayEvents } from '../events/useDayEvents'
import { useEventFocus } from '../events/eventFocusStore'
import { useEventBySlug } from '../events/useEventBySlug'
import { useGeocodedEvents } from '../location/useGeocodedEvents'
import { useI18n } from '../../i18n/useI18n'

// Leaflet só é baixado a partir de `md`, quando o mapa aparece.
const EventsMap = lazy(() => import('./EventsMap'))

type Props = {
  startDate: IsoDate
  /** Dia ativo do feed: o mapa mostra os eventos dele. */
  day: IsoDate
  genres: readonly GenreFilterValue[]
  onOpenEvent: (slug: string) => void
  /** Altura do painel (padrão: coluna inteira). */
  className?: string
}

/** Coluna do mapa (`md+`): pinos dos eventos do dia ativo, com o filtro de gêneros aplicado. */
export function MapPanel({ startDate, day, genres, onOpenEvent, className = 'h-full' }: Props) {
  const { t, locale } = useI18n()
  const { events, isPending } = useDayEvents(startDate, day, genres)
  // O evento aberto aparece no mapa mesmo se for de outro dia ou estiver fora do filtro.
  const selectedSlug = useEventFocus((state) => state.selectedSlug)
  const selected = useEventBySlug(startDate, selectedSlug)
  const withSelected = useMemo(
    () => (selected && !events.some((event) => event.id === selected.id) ? [...events, selected] : events),
    [events, selected],
  )
  // Locais fora do venues.json: coordenadas buscadas na hora (Photon), guardadas no aparelho.
  const { events: mapEvents, pending: locating } = useGeocodedEvents(withSelected)
  const dayIds = useMemo(() => new Set(events.map((event) => event.id)), [events])
  const withoutCoords = mapEvents.filter((event) => dayIds.has(event.id) && event.venue?.lat === undefined).length
  const resolvedSelected = mapEvents.find((event) => event.id === selected?.id)

  return (
    <section
      aria-label={t.map.label}
      className={`relative isolate min-h-0 overflow-hidden rounded-2xl bg-genre-neutral shadow-md dark:border dark:border-border dark:shadow-none ${className}`}
    >
      {/* Resumo por cima do mapa (Leaflet usa z-index até 1000 dentro do próprio contexto).
          Com um evento aberto: nome, dia e horário dele; senão, o dia ativo e quantos eventos tem. */}
      <div className="absolute inset-x-2 top-2 z-[1000] rounded-xl bg-surface/95 px-4 py-2 text-sm shadow-sm backdrop-blur">
        {selected ? (
          <>
            <p className="truncate font-semibold" title={selected.title}>
              {selected.title}
            </p>
            <p className="text-fg-muted tabular-nums" aria-live="polite">
              {formatDayHeading(lisbonDate(selected.start), locale)} · {formatTimeRange(selected, locale)}
              {resolvedSelected?.venue?.lat === undefined && ` · ${locating > 0 ? t.map.locating : t.map.noLocation}`}
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold">{formatDayHeading(day, locale)}</p>
            <p className="text-fg-muted" aria-live="polite">
              {isPending
                ? t.map.loading
                : events.length === 0
                  ? t.map.none
                  : `${t.map.count(events.length)}${
                      locating > 0 ? ` · ${t.map.locating}` : withoutCoords > 0 ? ` · ${t.map.withoutLocation(withoutCoords)}` : ''
                    }`}
            </p>
          </>
        )}
      </div>

      <Suspense fallback={<div aria-hidden="true" className="h-full w-full animate-pulse bg-genre-neutral" />}>
        <EventsMap events={mapEvents} onOpenEvent={onOpenEvent} />
      </Suspense>
    </section>
  )
}
