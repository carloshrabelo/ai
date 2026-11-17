import type { ReactNode } from 'react'
import { useLoaderData } from 'react-router'
import type { EventsLoaderData } from '../data/eventsLoader'
import { EventFeed } from '../features/events/EventFeed'
import { SidebarPortal } from '../layouts/SidebarSlot'

/**
 * Rota "/" — eventos de dança.
 * Layout do passo 3: as áreas tracejadas são preenchidas nos passos 4 a 7 do PLANO.md.
 */
export default function Dance() {
  const { startDate } = useLoaderData() as EventsLoaderData

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <Placeholder className="h-11">Atalhos de dia (passo 5)</Placeholder>
        <Placeholder className="h-16">Faixa da semana (passo 5)</Placeholder>

        {/* Até 1279px os filtros ficam no conteúdo; a partir de `xl`, na sidebar. */}
        <div className="xl:hidden">
          <Placeholder className="h-24">Filtros por gênero (passo 6)</Placeholder>
        </div>
        <SidebarPortal>
          <Placeholder className="h-11">Atalhos de dia (passo 5)</Placeholder>
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
