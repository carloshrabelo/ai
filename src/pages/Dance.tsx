import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react'
import { useLoaderData } from 'react-router'
import type { EventsLoaderData } from '../data/eventsLoader'
import { DayShortcuts } from '../features/dates/DayShortcuts'
import { useDayNavigation } from '../features/dates/useDayNavigation'
import { WeekStrip } from '../features/dates/WeekStrip'
import { eventFocus, useEventFocus } from '../features/events/eventFocusStore'
import { EventFeed } from '../features/events/EventFeed'
import { EventDetailsDrawer, EventDetailsPanel } from '../features/events/SelectedEventView'
import { useLegacyEventRedirect } from '../features/events/useLegacyEventRedirect'
import { useSelectedEvent } from '../features/events/useSelectedEvent'
import { GenreFilter } from '../features/genres/GenreFilter'
import { GenreFilterPopover } from '../features/genres/GenreFilterPopover'
import { GenreFilterButton } from '../features/genres/GenreFilterButton'
import { LocationControl } from '../features/location/LocationControl'
import { Card } from '../components/ui/Card'
import { useGenreFilter } from '../features/genres/useGenreFilter'
import { MapPanel } from '../features/map/MapPanel'
import { useMediaQuery, XL_QUERY } from '../hooks/useMediaQuery'
import { SidebarPortal } from '../layouts/SidebarSlot'
import { DanceHead } from '../seo/DanceHead'
import { useI18n } from '../i18n/useI18n'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button } from '../components/ui/Button'
import { ChangesBanner } from '../features/tracking/ChangesBanner'

/** Rota "/" — eventos de dança. Um feed novo (e estado novo) para cada data inicial. */
export default function Dance() {
  const { startDate, today } = useLoaderData() as EventsLoaderData
  return <DanceFeed key={startDate} startDate={startDate} today={today} />
}

function DanceFeed({ startDate, today }: EventsLoaderData) {
  const stickyRef = useRef<HTMLDivElement>(null)
  const { activeDay, selectDay } = useDayNavigation(startDate, stickyRef)
  const { selected: genres } = useGenreFilter()
  const { selectedSlug: selectedInUrl, open, close } = useSelectedEvent()
  useLegacyEventRedirect(startDate)

  // A URL (/evento/<slug>/) guarda a seleção; o eventFocusStore é a fonte única que lista, mapa e
  // detalhes leem. useLayoutEffect: sincroniza antes da pintura, sem um frame desatualizado.
  useLayoutEffect(() => eventFocus.syncSelectedFromUrl(selectedInUrl), [selectedInUrl])
  useLayoutEffect(() => () => eventFocus.reset(), []) // saindo da página
  const selectedSlug = useEventFocus((state) => state.selectedSlug)
  const fromList = useEventFocus((state) => state.selectedFrom === 'list')

  // Abrir pela lista ou pelo mapa: o store guarda a origem (define a ordem mapa/detalhes).
  const openFromList = useCallback(
    (slug: string) => {
      eventFocus.willSelectFrom('list', slug)
      open(slug)
    },
    [open],
  )
  const openFromMap = useCallback(
    (slug: string) => {
      eventFocus.willSelectFrom('map', slug)
      open(slug)
    },
    [open],
  )
  const isXl = useMediaQuery(XL_QUERY)
  const { t } = useI18n()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const closeFilters = useCallback(() => setFiltersOpen(false), [])
  const filtersId = useId()

  const detailsProps = { startDate, slug: selectedSlug ?? '', onClose: close }

  const shortcuts = <DayShortcuts today={today} activeDay={activeDay} onSelect={selectDay} />

  return (
    <div className="flex gap-6">
      <DanceHead startDate={startDate} selectedSlug={selectedSlug} />
      <div className="min-w-0 flex-1 space-y-4">
        {/* Fixo logo abaixo do header enquanto a lista rola. */}
        <div
          ref={stickyRef}
          className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-[5] -mx-4 space-y-2 bg-bg px-4 py-2 md:-mx-6 md:px-6 xl:-mr-6 xl:-ml-8 xl:pr-6 xl:pl-8"
        >
          <div className="xl:hidden">{shortcuts}</div>
          <WeekStrip
            startDate={startDate}
            activeDay={activeDay}
            onSelect={selectDay}
            actions={
              <GenreFilterButton
                open={filtersOpen}
                onToggle={() => setFiltersOpen((value) => !value)}
                controls={filtersId}
                activeCount={genres.length}
              />
            }
          />

          {/* A partir de `xl`: popover logo abaixo da faixa de dias. */}
          {isXl && filtersOpen && <GenreFilterPopover id={filtersId} onClose={closeFilters} />}

          {/* Até 1279px: os filtros abrem num drawer que sobe de baixo. */}
          {!isXl && filtersOpen && (
            <BottomSheet
              id={filtersId}
              label={t.filters.title}
              onClose={() => setFiltersOpen(false)}
              footer={(close) => (
                <Button className="w-full" onClick={close}>
                  {t.filters.done}
                </Button>
              )}
            >
              <GenreFilter plain />
            </BottomSheet>
          )}
        </div>

        <SidebarPortal>
          {shortcuts}
          <Card variant="panel">
            <LocationControl />
          </Card>
        </SidebarPortal>

        <ChangesBanner startDate={startDate} onOpenEvent={openFromList} />
        <EventFeed startDate={startDate} genres={genres} onOpenEvent={openFromList} />
      </div>

      {/* A partir de `xl`: coluna do mapa, que divide o espaço com os detalhes quando um evento está aberto. */}
      <aside aria-label={t.nav.mapColumn} className="sticky top-20 hidden h-[calc(100dvh-7rem)] w-90 shrink-0 flex-col gap-4 xl:flex 2xl:w-120">
        {isXl && (
          <>
            {/* Sem evento aberto, o mapa ocupa a coluna. Com evento aberto, a coluna se divide por
                flex-grow (base 0), na ordem visual também no HTML (leitura e Tab seguem a tela):
                - aberto pela lista: detalhes em cima (2/3) e mapa embaixo (1/3);
                - aberto pelo mapa ou por link: mapa em cima (2/5) e detalhes embaixo (3/5). */}
            {selectedSlug && fromList && <EventDetailsPanel key="details" {...detailsProps} className="grow-2 basis-0" />}
            <MapPanel
              key="map"
              startDate={startDate}
              day={activeDay}
              genres={genres}
              onOpenEvent={openFromMap}
              className={!selectedSlug ? 'flex-1' : fromList ? 'grow basis-0' : 'grow-2 basis-0'}
            />
            {selectedSlug && !fromList && <EventDetailsPanel key="details" {...detailsProps} className="grow-3 basis-0" />}
          </>
        )}
      </aside>

      {/* Abaixo de `xl`: detalhes como página num drawer. */}
      {!isXl && selectedSlug && <EventDetailsDrawer startDate={startDate} slug={selectedSlug} onClose={close} />}
    </div>
  )
}
