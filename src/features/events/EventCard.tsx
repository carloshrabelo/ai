import { CalendarPlus, ChevronRight, Clock, MapPin } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Chip'
import { Skeleton } from '../../components/ui/Skeleton'
import type { DanceEvent } from '../../domain/event'
import { formatTimeRange } from './format'

const ICON_LINK =
  'relative z-10 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

type Props = {
  event: DanceEvent
  /** Evento aberto nos detalhes. */
  selected?: boolean
  onOpen: (id: string) => void
}

/**
 * O card inteiro abre os detalhes (o botão é o título, esticado sobre o card).
 * O link do calendário fica por cima e continua clicável.
 */
export function EventCard({ event, selected = false, onOpen }: Props) {
  return (
    <Card
      as="article"
      className={`relative flex flex-col gap-2 transition-shadow hover:shadow-md ${selected ? 'ring-2 ring-brand' : ''}`}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-lg font-semibold">
            <button
              type="button"
              aria-current={selected || undefined}
              onClick={() => onOpen(event.id)}
              className="cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-brand"
            >
              {event.title}
            </button>
          </h3>
          {event.venue && (
            <p className="flex items-center gap-2 text-sm text-fg-muted">
              <MapPin className="size-5 shrink-0" aria-hidden="true" />
              <span className="truncate">{event.venue.name}</span>
            </p>
          )}
          <p className="flex items-center gap-2 text-sm text-fg-muted tabular-nums">
            <Clock className="size-5 shrink-0" aria-hidden="true" />
            {formatTimeRange(event)}
          </p>
        </div>
        <a
          href={event.calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Adicionar "${event.title}" ao calendário`}
          title="Adicionar ao calendário"
          className={`-mt-2 -mr-2 ${ICON_LINK}`}
        >
          <CalendarPlus className="size-5" aria-hidden="true" />
        </a>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {event.genres.length > 0
            ? event.genres.map((genre) => <Chip key={genre} genre={genre} />)
            : event.rawTag && <Chip label={event.rawTag} />}
          {event.price && <Chip label={event.price} />}
        </div>
        <ChevronRight className="size-5 shrink-0 text-fg-muted" aria-hidden="true" />
      </div>
    </Card>
  )
}

/** Mesmas dimensões do EventCard. */
export function EventCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`flex flex-col gap-2 ${className}`}>
      <div className="space-y-1">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
      <div className="flex gap-2">
        <Skeleton rounded="rounded-full" className="h-7 w-16" />
        <Skeleton rounded="rounded-full" className="h-7 w-20" />
        <Skeleton rounded="rounded-full" className="h-7 w-14" />
      </div>
    </Card>
  )
}
