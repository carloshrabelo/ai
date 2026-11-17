import { lazy, Suspense } from 'react'
import type { IsoDate } from '../../data/dates'
import type { Genre } from '../../domain/genres'
import { formatDayHeading } from '../events/format'
import { useDayEvents } from '../events/useDayEvents'

// Leaflet só é baixado a partir de `xl`, quando o mapa aparece.
const EventsMap = lazy(() => import('./EventsMap'))

type Props = {
  startDate: IsoDate
  /** Dia ativo do feed: o mapa mostra os eventos dele. */
  day: IsoDate
  genres: readonly Genre[]
  onOpenEvent: (id: string) => void
}

/** Coluna do mapa (`xl+`): pinos dos eventos do dia ativo, com o filtro de gêneros aplicado. */
export function MapPanel({ startDate, day, genres, onOpenEvent }: Props) {
  const { events, isPending } = useDayEvents(startDate, day, genres)
  const withoutCoords = events.filter((event) => event.venue?.lat === undefined).length

  return (
    <section
      aria-label="Mapa dos eventos do dia"
      className="relative isolate h-full overflow-hidden rounded-2xl bg-genre-neutral shadow-md dark:border dark:border-border dark:shadow-none"
    >
      {/* Resumo por cima do mapa (Leaflet usa z-index até 1000 dentro do próprio contexto). */}
      <div className="absolute inset-x-2 top-2 z-[1000] rounded-xl bg-surface/95 px-4 py-2 text-sm shadow-sm backdrop-blur">
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
      </div>

      <Suspense fallback={<div aria-hidden="true" className="h-full w-full animate-pulse bg-genre-neutral" />}>
        <EventsMap events={events} onOpenEvent={onOpenEvent} />
      </Suspense>
    </section>
  )
}
