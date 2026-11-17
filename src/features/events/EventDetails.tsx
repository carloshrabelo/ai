import { CalendarPlus, Clock, ExternalLink, MapPin, Ticket } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import { Chip } from '../../components/ui/Chip'
import { Skeleton } from '../../components/ui/Skeleton'
import { lisbonDate } from '../../data/dates'
import type { DanceEvent } from '../../domain/event'
import { renderDescription } from './description'
import { formatDayHeading, formatTimeRange } from './format'

/** Conteúdo dos detalhes: usado no painel da coluna do mapa (`xl+`) e no drawer (abaixo de `xl`). */
export function EventDetails({ event, headingId }: { event: DanceEvent; headingId: string }) {
  const html = useMemo(() => (event.description ? renderDescription(event.description) : ''), [event.description])
  const mapsUrl = event.venue ? mapsLink(event) : undefined

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 id={headingId} tabIndex={-1} className="text-2xl font-semibold outline-none">
          {event.title}
        </h2>
        <div className="flex flex-wrap gap-2">
          {event.genres.length > 0
            ? event.genres.map((genre) => <Chip key={genre} genre={genre} />)
            : event.rawTag && <Chip label={event.rawTag} />}
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <Row icon={<Clock className="size-5" aria-hidden="true" />} label="Quando">
          <span className="block">{formatDayHeading(lisbonDate(event.start))}</span>
          <span className="block text-fg-muted tabular-nums">{formatTimeRange(event)}</span>
        </Row>
        {event.venue && (
          <Row icon={<MapPin className="size-5" aria-hidden="true" />} label="Onde">
            <span className="block">{event.venue.name}</span>
            {event.venue.address && <span className="block text-fg-muted">{event.venue.address}</span>}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1 font-medium text-brand underline-offset-2 hover:underline"
              >
                Abrir no mapa
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            )}
          </Row>
        )}
        {event.price && (
          <Row icon={<Ticket className="size-5" aria-hidden="true" />} label="Preço">
            {event.price}
          </Row>
        )}
      </dl>

      <a
        href={event.calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <CalendarPlus className="size-5" aria-hidden="true" />
        Adicionar ao calendário
      </a>

      {html && (
        <section aria-label="Descrição" className="border-t border-border pt-4">
          <div
            className="text-sm break-words text-fg [&_a]:text-brand [&_a]:underline"
            // Sanitizado em renderDescription (DOMPurify).
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </section>
      )}
    </div>
  )
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 pt-0.5 text-fg-muted">
        {icon}
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  )
}

/** Link para o mapa: coordenadas quando conhecidas, senão o endereço. */
function mapsLink(event: DanceEvent): string {
  const { venue } = event
  if (venue?.lat !== undefined && venue.lng !== undefined) {
    return `https://www.openstreetmap.org/?mlat=${venue.lat}&mlon=${venue.lng}#map=17/${venue.lat}/${venue.lng}`
  }
  const query = [venue?.name, venue?.address].filter(Boolean).join(', ')
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`
}

/** Enquanto os eventos carregam (ex.: link direto com ?event=). */
export function EventDetailsSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <span className="sr-only">Carregando evento…</span>
      <Skeleton className="h-8 w-3/4" />
      <div className="flex gap-2">
        <Skeleton rounded="rounded-full" className="h-7 w-16" />
        <Skeleton rounded="rounded-full" className="h-7 w-20" />
      </div>
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-11 w-48" rounded="rounded-lg" />
    </div>
  )
}
