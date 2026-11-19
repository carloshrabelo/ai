import { memo } from 'react'
import { ArrowSquareOutIcon, CalendarPlusIcon, ClockIcon, MapPinIcon, TicketIcon } from '@phosphor-icons/react'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Chip'
import { Skeleton } from '../../components/ui/Skeleton'
import { Tooltip } from '../../components/ui/Tooltip'
import type { DanceEvent } from '../../domain/event'
import { visibleGenres } from '../../domain/genres'
import { EventDistance } from '../location/EventDistance'
import { eventFocus, useEventFocus } from './eventFocusStore'
import { EventStatusBadge } from './EventStatusBadge'
import { NoPriceChips, PriceChips } from '../price/PriceChips'
import { formatTimeRange } from './format'
import { useI18n } from '../../i18n/useI18n'
import { slugify } from '../../domain/slug'
import { eventUrl } from '../../seo/useDocumentHead'
import { detectPlatform } from '../location/navigationLink'
import { trackEvent } from '../tracking/trackedEvents'
import { downloadIcs, googleCalendarUrl } from './calendarLinks'

const ICON_LINK =
  'relative z-10 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

type Props = {
  event: DanceEvent
  onOpen: (slug: string) => void
}

/**
 * O card inteiro abre os detalhes (o botão é o título, esticado sobre o card).
 * O link do calendário fica por cima e continua clicável.
 * Seleção e hover vêm do eventFocusStore (fonte única, compartilhada com o mapa).
 */
export const EventCard = memo(function EventCard({ event, onOpen }: Props) {
  const { t, locale } = useI18n()
  // Só este card re-renderiza quando a seleção ou o hover dele mudam.
  const selected = useEventFocus((state) => state.selectedSlug === event.slug)
  const highlighted = useEventFocus((state) => state.hover?.source === 'map' && state.hover.ids.includes(event.id))
  const hover = () => eventFocus.hover([event.id], 'list')
  const unhover = () => eventFocus.unhover('list')

  return (
    <Card
      as="article"
      onMouseEnter={hover}
      onMouseLeave={unhover}
      onFocus={hover}
      onBlur={unhover}
      className={`relative isolate flex flex-col gap-3 transition-shadow hover:shadow-md ${
        selected || highlighted ? 'ring-2 ring-brand' : ''
      } ${event.status === 'cancelled' ? 'opacity-75' : ''}`}
    >
      {/* Cabeçalho: título e o botão do calendário. */}
      <header className="flex items-start gap-2">
        <h3 className="line-clamp-2 min-w-0 flex-1 text-lg font-semibold">
          <button
            type="button"
            aria-current={selected || undefined}
            onClick={() => onOpen(event.slug)}
            className={`cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-brand ${
              event.status === 'cancelled' ? 'line-through decoration-2' : ''
            }`}
          >
            {event.title}
          </button>
        </h3>
        {/* Tooltip visível: o ícone sozinho não é óbvio para todo mundo. -my-2: o botão (44px) não aumenta a altura do cabeçalho além do título. */}
        <Tooltip label={t.event.addToCalendar} className="relative z-10 -my-2 -mr-2 shrink-0">
          {/* Google Agenda já preenchido; no iPhone, baixa o .ics (Calendário do iOS). */}
          <a
            href={googleCalendarUrl(event, eventUrl(event.slug))}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.event.addToCalendarFor(event.title)}
            className={ICON_LINK}
            onClick={(click) => {
              trackEvent(event)
              if (detectPlatform() === 'ios') {
                click.preventDefault()
                downloadIcs(event, eventUrl(event.slug), slugify(event.title) || 'evento')
              }
            }}
          >
            <CalendarPlusIcon className="size-5" aria-hidden="true" />
          </a>
        </Tooltip>
      </header>

      {/* Conteúdo: largura toda do card (o calendário não ocupa mais uma coluna). */}
      <div className="space-y-1.5">
        {event.venue && (
          <p className="flex items-center gap-2 text-sm text-fg-muted">
            <MapPinIcon className="size-5 shrink-0" aria-hidden="true" />
            <span className="truncate">{event.venue.name}</span>
          </p>
        )}
        {/* Horário e preço na mesma linha, o preço à direita; preço longo quebra para a linha de baixo
            (e fica à esquerda). */}
        <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-fg-muted">
          <span className="flex items-center gap-2 tabular-nums">
            <ClockIcon className="size-5 shrink-0" aria-hidden="true" />
            <span className="sr-only">{t.event.time}: </span>
            {formatTimeRange(event, locale)}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <TicketIcon className="size-5 shrink-0" aria-hidden="true" />
            <span className="sr-only">{t.event.price}: </span>
            {event.price ? (
              <PriceChips price={event.price} variant="auto" locale={locale} />
            ) : (
              <NoPriceChips hasDescription={!!event.description} />
            )}
          </span>
        </p>
      </div>

      {/* mt-auto: as tags ficam sempre embaixo, mesmo num card esticado (grid da lista e do mapa). */}
      <div className="mt-auto flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {event.status && <EventStatusBadge status={event.status} />}
          {event.genres.length > 0
            ? visibleGenres(event.genres).map((genre) => <Chip key={genre} genre={genre} />)
            : event.rawTag && <Chip label={event.rawTag} />}
        </div>
        <EventDistance venue={event.venue} />
        <ArrowSquareOutIcon className="size-5 shrink-0 text-fg-muted" aria-hidden="true" />
      </div>
    </Card>
  )
})

/** Mesmas dimensões do EventCard. */
export function EventCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`flex flex-col gap-3 ${className}`}>
      <Skeleton className="h-7 w-3/4" />
      <div className="space-y-1.5">
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
