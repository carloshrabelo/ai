import {
  BellRingingIcon,
  CalendarPlusIcon,
  CaretUpIcon,
  ClockIcon,
  MapPinIcon,
  NavigationArrowIcon,
  TicketIcon,
} from '@phosphor-icons/react'
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'
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
import { buttonClassName } from '../../components/ui/buttonStyles'
import { slugify } from '../../domain/slug'
import { eventUrl } from '../../seo/useDocumentHead'
import { untrackEvent, useIsTracked, trackEvent } from '../tracking/trackedEvents'
import { downloadIcs, googleCalendarUrl } from './calendarLinks'
import { track } from '../../analytics/track'

/**
 * Conteúdo dos detalhes: usado no painel da coluna do mapa (`xl+`) e no drawer (abaixo de `xl`), que
 * mostram o título no header fixo deles (`showTitle={false}`); com o título, em /test/no-price.
 */
export function EventDetails({ event, headingId, showTitle = true }: { event: DanceEvent; headingId?: string; showTitle?: boolean }) {
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
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-2">
        {showTitle && (
          <h2 id={headingId} tabIndex={-1} className="text-2xl font-semibold outline-none">
            {event.title}
          </h2>
        )}
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
              <span className="min-w-0 break-words">{event.venue.name}</span>
              <EventDistance venue={event.venue} />
            </span>
            {event.venue.address && <span className="block break-words text-fg-muted">{event.venue.address}</span>}
          </Row>
        )}
        {/* Chips do preço têm 28px: o ícone centraliza nessa primeira linha (e não na de texto, 20px). */}
        <Row icon={<TicketIcon className="size-5" aria-hidden="true" />} label={t.event.price} line="h-7">
          {event.price ? (
            <PriceChips price={event.price} variant="auto" locale={locale} />
          ) : (
            <NoPriceChips hasDescription={!!event.description} />
          )}
        </Row>
      </dl>

      {/* Divisor entre as informações e a descrição, com "Abrir no mapa" à direita, centralizado na linha.
          Fixo logo abaixo do header com o título (drawer ou painel) enquanto a descrição rola: a altura
          do header vem em --details-sticky-top (SelectedEventView), pois o título pode ter várias
          linhas. Fundo igual ao de cada um (drawer bg-bg, painel bg-surface) e largura total
          (-mx-4 px-4) para a descrição passar por baixo; embaixo, um degradê da mesma cor (24px) faz o
          texto sumir aos poucos em vez de cortar seco. -mt-3: o gap-4 + o py-2 davam 24px acima do botão;
          ficam 12px (a margem não muda a posição quando gruda, então o respiro sob o header continua). */}
      {(directions || html) && (
        <div className="sticky top-[var(--details-sticky-top,0px)] z-[5] -mx-4 -mt-3 flex items-center gap-3 bg-bg px-4 py-2 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-6 after:bg-linear-to-b after:from-bg after:to-transparent xl:bg-surface xl:after:from-surface">
          <hr aria-hidden="true" className="h-0 flex-1 border-0 border-t-2 border-border" />
          {directions && (
            <a
              {...track('event.open-in-maps', event.slug)}
              href={directions.href}
              {...(directions.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={buttonClassName('secondary', 'h-9 shrink-0 px-3 text-xs')}
            >
              <NavigationArrowIcon className="size-4" aria-hidden="true" />
              {t.event.openInMaps}
            </a>
          )}
        </div>
      )}

      {/* Acompanhar mudanças: aparece depois de adicionar à agenda. */}
      {tracked && (
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-fg-muted">
          <BellRingingIcon className="size-4 shrink-0" aria-hidden="true" />
          {t.tracking.tracked}
          <button
            type="button"
            {...track('event.untrack', event.slug)}
            onClick={() => untrackEvent(event.id)}
            className="min-h-11 cursor-pointer font-bold text-brand underline-offset-2 hover:underline"
          >
            {t.tracking.stop}
          </button>
        </p>
      )}

      {html && <Description html={html} />}

      <ActionsBar event={event} />
    </div>
  )
}

/**
 * Ações fixas no rodapé dos detalhes (sempre à vista, mesmo com descrição longa): "Adicionar à agenda"
 * abre as opções (Google Agenda ou .ics para Apple/Outlook) e o compartilhar fica ao lado, só ícone.
 */
function ActionsBar({ event }: { event: DanceEvent }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (pointer: PointerEvent) => {
      if (!barRef.current?.contains(pointer.target as Node)) setOpen(false)
    }
    const onKey = (key: KeyboardEvent) => {
      if (key.key === 'Escape') {
        key.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return (
    <div
      ref={barRef}
      className="sticky bottom-0 z-10 -mx-4 mt-auto border-t-2 border-border bg-surface px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      {open && (
        <div
          id={menuId}
          className="absolute inset-x-4 bottom-full mb-2 grid gap-2 rounded-2xl border-2 border-b-4 border-border bg-surface p-2 shadow-md"
        >
          <a
            {...track('event.add-google', event.slug)}
            href={googleCalendarUrl(event, eventUrl(event.slug))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent(event)
              setOpen(false)
            }}
            className={buttonClassName('primary', 'w-full')}
          >
            <CalendarPlusIcon className="size-5" aria-hidden="true" />
            {t.tracking.googleCalendar}
          </a>
          <Button
            {...track('event.add-ics', event.slug)}
            variant="secondary"
            className="w-full"
            onClick={() => {
              trackEvent(event)
              downloadIcs(event, eventUrl(event.slug), slugify(event.title) || 'evento')
              setOpen(false)
            }}
          >
            <CalendarDownloadIcon className="size-5" />
            {t.tracking.icsCalendar}
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          {...track('event.add-to-calendar', event.slug)}
          className="flex-1"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          <CalendarPlusIcon className="size-5" aria-hidden="true" />
          {t.event.addToCalendar}
          <CaretUpIcon className={`size-4 transition-transform ${open ? '' : 'rotate-180'}`} aria-hidden="true" />
        </Button>
        <ShareButton event={event} iconOnly />
      </div>
    </div>
  )
}

/** Descrição completa, sem recolher. Links e palavras longas quebram em vez de alargar o painel. */
function Description({ html }: { html: string }) {
  const { t } = useI18n()
  return (
    <section aria-label={t.event.description}>
      <div
        className="text-[15px] [overflow-wrap:anywhere] text-fg [&_a]:text-(--brand-ink) [&_a]:underline"
        // Sanitizado em renderDescription (DOMPurify).
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  )
}

/**
 * Linha de informação: ícone (20px) à esquerda, centralizado na primeira linha do conteúdo. `line` é a
 * altura dessa primeira linha: h-5 para texto `text-sm` (20px), h-7 para chips (28px). Com o conteúdo
 * em várias linhas, o ícone continua na primeira.
 */
function Row({ icon, label, line = 'h-5', children }: { icon: ReactNode; label: string; line?: 'h-5' | 'h-7'; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className={`flex shrink-0 items-center text-fg-muted ${line}`}>
        {icon}
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  )
}

/** Enquanto os eventos carregam (ex.: link direto para /event/<slug>/). */
export function EventDetailsSkeleton() {
  const { t } = useI18n()
  return (
    <div aria-busy="true" className="space-y-4">
      <span className="sr-only">{t.event.loading}</span>
      <Skeleton className="h-8 w-3/4" />
      <div className="flex gap-2">
        <Skeleton rounded="rounded-xl" className="h-7 w-16" />
        <Skeleton rounded="rounded-xl" className="h-7 w-20" />
      </div>
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-11 w-48" rounded="rounded-2xl" />
    </div>
  )
}
