import { type ReactNode, useId, useRef, useState } from 'react'
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

        <EventFeed startDate={startDate} genres={genres} selectedId={selectedId} onOpenEvent={open} />
      </div>

      {/* A partir de `xl`: coluna do mapa, que mostra os detalhes quando um evento está aberto. */}
      <aside className="sticky top-20 hidden h-[calc(100dvh-7rem)] w-90 shrink-0 xl:block 2xl:w-120">
        {isXl && selectedId ? (
          <EventDetailsPanel startDate={startDate} eventId={selectedId} onClose={close} />
        ) : (
          <Placeholder className="h-full">Mapa (passo 7)</Placeholder>
        )}
      </aside>

      {/* Abaixo de `xl`: detalhes como página num drawer. */}
      {!isXl && selectedId && <EventDetailsDrawer startDate={startDate} eventId={selectedId} onClose={close} />}
    </div>
  )
}

function Placeholder({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border-2 border-dashed border-border p-4 text-center text-sm text-fg-muted ${className}`}
    >
      {children}
    </div>
  )
}
