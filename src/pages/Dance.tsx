import { type ReactNode, useRef } from 'react'
import { useLoaderData } from 'react-router'
import type { EventsLoaderData } from '../data/eventsLoader'
import { DayShortcuts } from '../features/dates/DayShortcuts'
import { useDayNavigation } from '../features/dates/useDayNavigation'
import { WeekStrip } from '../features/dates/WeekStrip'
import { EventFeed } from '../features/events/EventFeed'
import { SidebarPortal } from '../layouts/SidebarSlot'

/** Rota "/" — eventos de dança. Um feed novo (e estado novo) para cada data inicial. */
export default function Dance() {
  const { startDate, today } = useLoaderData() as EventsLoaderData
  return <DanceFeed key={startDate} startDate={startDate} today={today} />
}

function DanceFeed({ startDate, today }: EventsLoaderData) {
  const stickyRef = useRef<HTMLDivElement>(null)
  const { activeDay, selectDay } = useDayNavigation(startDate, stickyRef)

  const shortcuts = <DayShortcuts today={today} activeDay={activeDay} onSelect={selectDay} />

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        {/* Fixo logo abaixo do header enquanto a lista rola. */}
        <div
          ref={stickyRef}
          className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-[5] -mx-4 space-y-2 bg-bg px-4 py-2 md:-mx-6 md:px-6 xl:-mx-8 xl:px-8"
        >
          <div className="xl:hidden">{shortcuts}</div>
          <WeekStrip startDate={startDate} activeDay={activeDay} onSelect={selectDay} />
        </div>

        {/* Até 1279px os filtros ficam no conteúdo; a partir de `xl`, na sidebar. */}
        <div className="xl:hidden">
          <Placeholder className="h-24">Filtros por gênero (passo 6)</Placeholder>
        </div>
        <SidebarPortal>
          {shortcuts}
          <Placeholder className="h-40">Filtros por gênero (passo 6)</Placeholder>
        </SidebarPortal>

        <EventFeed startDate={startDate} />
      </div>

      <aside className="sticky top-20 hidden h-[calc(100dvh-7rem)] w-90 shrink-0 xl:block 2xl:w-120">
        <Placeholder className="h-full">Mapa (passo 7)</Placeholder>
      </aside>
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
