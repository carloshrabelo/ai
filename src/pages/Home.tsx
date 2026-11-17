import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { useLoaderData } from 'react-router'
import type { EventsLoaderData } from '../data/eventsLoader'
import { eventsInfiniteQueryOptions } from '../data/queries'

/**
 * Versão provisória (passo 0.5 do PLANO.md): lista os títulos crus por janela,
 * só para validar a camada de dados. A tela real vem nos passos 3 e 4.
 */
export default function Home() {
  const { startDate } = useLoaderData() as EventsLoaderData

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Eventos Futuros</h2>
      <Suspense
        fallback={
          <p aria-busy="true" className="text-sm text-slate-500">
            Carregando eventos…
          </p>
        }
      >
        <RawEventFeed startDate={startDate} />
      </Suspense>
    </section>
  )
}

function RawEventFeed({ startDate }: EventsLoaderData) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(
    eventsInfiniteQueryOptions(startDate),
  )

  return (
    <div className="space-y-6">
      {data.pages.map((page) => (
        <div key={page.start} className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-500 tabular-nums">
            {page.start} → {page.end} · {page.events.length} eventos
          </h3>
          <ul className="space-y-1 text-sm">
            {page.events.map((event) => (
              <li key={event.id}>
                <span className="text-slate-500 tabular-nums">{event.start.toLocaleString('pt-BR')}</span>{' '}
                {event.title} <span className="text-slate-500">· {event.genres.join(', ') || event.rawTag}</span>
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
          className="h-11 rounded-lg bg-brand px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {isFetchingNextPage ? 'Carregando…' : 'Carregar mais 2 semanas'}
        </button>
      ) : (
        <p className="text-sm text-slate-500">Sem mais eventos por enquanto.</p>
      )}
    </div>
  )
}
