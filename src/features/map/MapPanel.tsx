import { lazy, Suspense, useMemo } from 'react'
import { type IsoDate, lisbonDate } from '../../data/dates'
import type { GenreFilterValue } from '../../domain/genreFilter'
import { formatDayHeading, formatTimeRange } from '../events/format'
import { useDayEvents } from '../events/useDayEvents'
import { useEventFocus } from '../events/eventFocusStore'
import { useEventById } from '../events/useEventById'

// Leaflet só é baixado a partir de `xl`, quando o mapa aparece.
const EventsMap = lazy(() => import('./EventsMap'))

type Props = {
  startDate: IsoDate
  /** Dia ativo do feed: o mapa mostra os eventos dele. */
  day: IsoDate
  genres: readonly GenreFilterValue[]
  onOpenEvent: (id: string) => void
  /** Altura do painel (padrão: coluna inteira). */
  className?: string
}

/** Coluna do mapa (`xl+`): pinos dos eventos do dia ativo, com o filtro de gêneros aplicado. */
export function MapPanel({
  startDate,
  day,
  genres,
  onOpenEvent,
  className = 'h-full',
}: Props) {
  const { events, isPending } = useDayEvents(startDate, day, genres)
  // O evento aberto aparece no mapa mesmo se for de outro dia ou estiver fora do filtro.
  const selectedId = useEventFocus((state) => state.selectedId)
  const selected = useEventById(startDate, selectedId)
  const mapEvents = useMemo(
    () => (selected && !events.some((event) => event.id === selected.id) ? [...events, selected] : events),
    [events, selected],
  )
  const withoutCoords = events.filter((event) => event.venue?.lat === undefined).length

  return (
    <section
      aria-label="Mapa dos eventos do dia"
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
              {formatDayHeading(lisbonDate(selected.start))} · {formatTimeRange(selected)}
              {selected.venue?.lat === undefined && ' · sem local no mapa'}
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold">{formatDayHeading(day)}</p>
            <p className="text-fg-muted" aria-live="polite">
              {isPending
                ? 'Carregando eventos…'
                : events.length === 0
                  ? 'Nenhum evento neste dia.'
                  : `${events.length} evento${events.length > 1 ? 's' : ''}${
                      withoutCoords > 0 ? ` · ${withoutCoords} sem local no mapa` : ''
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
