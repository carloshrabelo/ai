import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { type ReactNode, Suspense } from 'react'
import { useLoaderData } from 'react-router'
import type { EventsLoaderData } from '../data/eventsLoader'
import { eventsInfiniteQueryOptions } from '../data/queries'
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

        <Suspense fallback={<p className="text-sm text-fg-muted">Carregando eventos…</p>}>
          <RawEventFeed startDate={startDate} />
        </Suspense>
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

/** Provisório: lista crua por janela, até o EventList do passo 4. */
function RawEventFeed({ startDate }: EventsLoaderData) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(
    eventsInfiniteQueryOptions(startDate),
  )

  return (
    <div className="space-y-6">
      {data.pages.map((page) => (
        <div key={page.start} className="space-y-2">
          <h3 className="text-sm font-semibold text-fg-muted tabular-nums">
            {page.start} → {page.end} · {page.events.length} eventos
          </h3>
          <ul className="grid gap-3 xl:grid-cols-2 xl:gap-4">
            {page.events.map((event) => (
              <li key={event.id} className="rounded-xl bg-surface p-4 text-sm shadow-sm dark:border dark:border-border">
                <p className="text-lg font-semibold">{event.title}</p>
                <p className="text-fg-muted tabular-nums">{event.start.toLocaleString('pt-BR')}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {hasNextPage ? (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="h-11 rounded-lg bg-brand px-4 text-sm font-medium text-brand-fg disabled:opacity-60"
        >
          {isFetchingNextPage ? 'Carregando…' : 'Carregar mais 2 semanas'}
        </button>
      ) : (
        <p className="text-sm text-fg-muted">Sem mais eventos por enquanto.</p>
      )}
    </div>
  )
}
