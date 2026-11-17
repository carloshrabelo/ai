import { CalendarPlus, ChevronDown, Clock, MapPin } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Chip'
import { Skeleton } from '../../components/ui/Skeleton'
import type { DanceEvent } from '../../domain/event'
import { renderDescription } from './description'
import { formatTimeRange } from './format'

const ICON_LINK =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

export function EventCard({ event }: { event: DanceEvent }) {
  const [expanded, setExpanded] = useState(false)
  const detailsId = useId()
  const hasDetails = !!event.description || !!event.venue?.address

  return (
    <Card as="article" className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-lg font-semibold">{event.title}</h3>
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
        {hasDetails && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailsId}
            aria-label={expanded ? 'Esconder detalhes' : 'Ver detalhes'}
            onClick={() => setExpanded((value) => !value)}
            className={`-mr-2 -mb-2 cursor-pointer ${ICON_LINK}`}
          >
            <ChevronDown className={`size-5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        )}
      </div>

      {expanded && <EventDetails id={detailsId} event={event} />}
    </Card>
  )
}

function EventDetails({ id, event }: { id: string; event: DanceEvent }) {
  const html = useMemo(() => (event.description ? renderDescription(event.description) : ''), [event.description])

  return (
    <div id={id} className="space-y-2 border-t border-border pt-2 text-sm">
      {event.venue?.address && <p className="text-fg-muted">{event.venue.address}</p>}
      {html && (
        <div
          className="break-words text-fg [&_a]:text-brand [&_a]:underline"
          // Sanitizado em renderDescription (DOMPurify).
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  )
}

/** Mesmas dimensões do EventCard fechado. */
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
