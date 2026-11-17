import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { useLoaderData } from 'react-router'
import type { EventsLoaderData } from '../data/eventsLoader'
import { DayShortcuts } from '../features/dates/DayShortcuts'
import { useDayNavigation } from '../features/dates/useDayNavigation'
import { WeekStrip } from '../features/dates/WeekStrip'
import { EventFeed } from '../features/events/EventFeed'
import { EventDetailsDrawer, EventDetailsPanel } from '../features/events/SelectedEventView'
import { useSelectedEvent } from '../features/events/useSelectedEvent'
import { GenreFilter } from '../features/genres/GenreFilter'
import { GenreFilterButton } from '../features/genres/GenreFilterButton'
import { useGenreFilter } from '../features/genres/useGenreFilter'
import { MapPanel } from '../features/map/MapPanel'
import { useMediaQuery, XL_QUERY } from '../hooks/useMediaQuery'
import { SidebarPortal } from '../layouts/SidebarSlot'

/** Rota "/" — eventos de dança. Um feed novo (e estado novo) para cada data inicial. */
export default function Dance() {
  const { startDate, today } = useLoaderData() as EventsLoaderData
  return <DanceFeed key={startDate} startDate={startDate} today={today} />
}

function DanceFeed({ startDate, today }: EventsLoaderData) {
  const stickyRef = useRef<HTMLDivElement>(null)
  const { activeDay, selectDay } = useDayNavigation(startDate, stickyRef)
  const { selected: genres } = useGenreFilter()
  const { selectedId, open, close } = useSelectedEvent()
  const isXl = useMediaQuery(XL_QUERY)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Hover ligando lista e mapa: card em hover destaca o pino; pino em hover destaca os cards do local.
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
  const [hoveredPinKey, setHoveredPinKey] = useState('') // ids separados por vírgula (string: evita re-render à toa)
  const highlightedIds = useMemo(() => new Set(hoveredPinKey ? hoveredPinKey.split(',') : []), [hoveredPinKey])
  const onHoverPlace = useCallback((ids: string[] | null) => setHoveredPinKey(ids?.join(',') ?? ''), [])
  const filtersId = useId()

  const shortcuts = <DayShortcuts today={today} activeDay={activeDay} onSelect={selectDay} />

  return (
    <div className="flex gap-6">
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
              // A partir de `xl` os filtros ficam sempre visíveis na sidebar.
              !isXl && (
                <GenreFilterButton
                  open={filtersOpen}
                  onToggle={() => setFiltersOpen((value) => !value)}
                  controls={filtersId}
                  activeCount={genres.length}
                />
              )
            }
          />

          {/* Até 1279px: a seção de filtros abre aqui, dentro da área fixa, visível em qualquer ponto da lista. */}
          {!isXl && filtersOpen && (
            <div
              id={filtersId}
              className="max-h-[50dvh] overflow-y-auto"
              onKeyDown={(event) => {
                if (event.key === 'Escape') setFiltersOpen(false)
              }}
            >
              <GenreFilter startDate={startDate} />
            </div>
          )}
        </div>

        <SidebarPortal>
          {shortcuts}
          <GenreFilter startDate={startDate} />
        </SidebarPortal>

        <EventFeed
          startDate={startDate}
          genres={genres}
          selectedId={selectedId}
          onOpenEvent={open}
          highlightedIds={highlightedIds}
          onHoverEvent={setHoveredCardId}
        />
      </div>

      {/* A partir de `xl`: coluna do mapa, que divide o espaço com os detalhes quando um evento está aberto. */}
      <aside className="sticky top-20 hidden h-[calc(100dvh-7rem)] w-90 shrink-0 flex-col gap-4 xl:flex 2xl:w-120">
        {isXl && (
          <>
            {/* Com um evento aberto, o mapa fica em cima e os detalhes embaixo. */}
            <MapPanel
              startDate={startDate}
              day={activeDay}
              genres={genres}
              selectedId={selectedId}
              hoveredId={hoveredCardId}
              onOpenEvent={open}
              onHoverPlace={onHoverPlace}
              className={selectedId ? 'h-2/5 shrink-0' : 'h-full'}
            />
            {selectedId && <EventDetailsPanel startDate={startDate} eventId={selectedId} onClose={close} />}
          </>
        )}
      </aside>

      {/* Abaixo de `xl`: detalhes como página num drawer. */}
      {!isXl && selectedId && <EventDetailsDrawer startDate={startDate} eventId={selectedId} onClose={close} />}
    </div>
  )
}
