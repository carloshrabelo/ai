import { BellRingingIcon, CalendarPlusIcon, ClockIcon, MapPinIcon, NavigationArrowIcon, TicketIcon } from '@phosphor-icons/react'
import { type ReactNode, useMemo } from 'react'
import { Chip } from '../../components/ui/Chip'
import { Skeleton } from '../../components/ui/Skeleton'
import { lisbonDate } from '../../lib/dates'
import type { DanceEvent } from '../../domain/event'
import { visibleGenres } from '../../domain/genres'
import { renderDescription } from './description'
import { EventDistance } from '../location/EventDistance'
import { navigationLink } from '../location/navigationLink'
import { useGeocodedVenue } from '../location/useGeocodedEvents'
import { EventStatusBadge } from './EventStatusBadge'
import { formatDayHeading, formatTimeRange } from './format'
import { CalendarDownloadIcon } from '../../components/icons/CalendarDownloadIcon'
import { NoPriceChips, PriceChips } from '../price/PriceChips'
import { ShareButton } from './ShareButton'
import { useI18n } from '../../i18n/useI18n'
import { Button } from '../../components/ui/Button'
import { slugify } from '../../domain/slug'
import { eventUrl } from '../../seo/useDocumentHead'
import { untrackEvent, useIsTracked, trackEvent } from '../tracking/trackedEvents'
import { downloadIcs, googleCalendarUrl } from './calendarLinks'

/** Conteúdo dos detalhes: usado no painel da coluna do mapa (`xl+`) e no drawer (abaixo de `xl`). */
export function EventDetails({ event, headingId }: { event: DanceEvent; headingId: string }) {
  const { t, locale } = useI18n()
  const tracked = useIsTracked(event.id)
  const instagramPost = t.event.instagramPost
  const html = useMemo(
    () => (event.description ? renderDescription(event.description, { instagramPost }) : ''),
    [event.description, instagramPost],
  )
  // App de navegação do aparelho (Android: seletor de apps; iOS: Apple Maps; desktop: Google Maps).
  // Local fora do venues.json: busca as coordenadas para a rota abrir no ponto certo.
  const venue = useGeocodedVenue(event.venue)
  const directions = venue ? navigationLink(venue) : undefined

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 id={headingId} tabIndex={-1} className="text-2xl font-semibold outline-none">
          {event.title}
        </h2>
        <div className="flex flex-wrap gap-2">
          {event.status && <EventStatusBadge status={event.status} />}
          {event.genres.length > 0
            ? visibleGenres(event.genres).map((genre) => <Chip key={genre} genre={genre} />)
            : event.rawTag && <Chip label={event.rawTag} />}
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <Row icon={<ClockIcon className="size-5" aria-hidden="true" />} label={t.event.when}>
          <span className="block">{formatDayHeading(lisbonDate(event.start), locale)}</span>
          <span className="block text-fg-muted tabular-nums">{formatTimeRange(event, locale)}</span>
        </Row>
        {event.venue && (
          <Row icon={<MapPinIcon className="size-5" aria-hidden="true" />} label={t.event.where}>
            <span className="flex items-baseline justify-between gap-2">
              {event.venue.name}
              <EventDistance venue={event.venue} />
            </span>
            {event.venue.address && <span className="block text-fg-muted">{event.venue.address}</span>}
            {directions && (
              <a
                href={directions.href}
                {...(directions.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="inline-flex min-h-11 items-center gap-1 font-medium text-brand underline-offset-2 hover:underline"
              >
                <NavigationArrowIcon className="size-4" aria-hidden="true" />
                {t.event.openInMaps}
              </a>
            )}
          </Row>
        )}
        <Row icon={<TicketIcon className="size-5" aria-hidden="true" />} label={t.event.price}>
          {event.price ? (
            <PriceChips price={event.price} variant="auto" locale={locale} />
          ) : (
            <NoPriceChips hasDescription={!!event.description} />
          )}
        </Row>
      </dl>

      {/* Adicionar ao calendário da pessoa (sem login) e passar a acompanhar mudanças. */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t.event.addToCalendar}</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={googleCalendarUrl(event, eventUrl(event.slug))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent(event)
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <CalendarPlusIcon className="size-5" aria-hidden="true" />
            {t.tracking.googleCalendar}
          </a>
          <Button
            variant="secondary"
            onClick={() => {
              trackEvent(event)
              downloadIcs(event, eventUrl(event.slug), slugify(event.title) || 'evento')
            }}
          >
            <CalendarDownloadIcon className="size-5" />
            {t.tracking.icsCalendar}
          </Button>
          <ShareButton event={event} />
        </div>
        {tracked && (
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-fg-muted">
            <BellRingingIcon className="size-4 shrink-0" aria-hidden="true" />
            {t.tracking.tracked}
            <button
              type="button"
              onClick={() => untrackEvent(event.id)}
              className="min-h-11 cursor-pointer font-medium text-brand underline-offset-2 hover:underline"
            >
              {t.tracking.stop}
            </button>
          </p>
        )}
      </div>

      {html && (
        <section aria-label={t.event.description} className="border-t border-border pt-4">
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

/** Enquanto os eventos carregam (ex.: link direto para /evento/<slug>/). */
export function EventDetailsSkeleton() {
  const { t } = useI18n()
  return (
    <div aria-busy="true" className="space-y-4">
      <span className="sr-only">{t.event.loading}</span>
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
