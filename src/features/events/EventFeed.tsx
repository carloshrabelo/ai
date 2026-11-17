import { QueryErrorResetBoundary, useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { CalendarX } from 'lucide-react'
import { Fragment, Suspense, useEffect, useMemo, useRef } from 'react'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { Button } from '../../components/ui/Button'
import type { IsoDate } from '../../data/dates'
import { eventsInfiniteQueryOptions, flattenEvents } from '../../data/queries'
import { matchesGenres } from '../../domain/genreFilter'
import type { Genre } from '../../domain/genres'
import { EventCard, EventCardSkeleton } from './EventCard'
import { formatDayHeading } from './format'
import { groupByDay } from './groupByDay'

const GRID = 'grid grid-cols-1 gap-3 xl:grid-cols-2 xl:gap-4'

/** Feed de eventos agrupado por dia, com skeleton, erro isolado e scroll infinito. */
type FeedProps = {
  startDate: IsoDate
  /** Gêneros do filtro (vazio = todos). */
  genres: readonly Genre[]
  /** Evento aberto nos detalhes (destacado na lista). */
  selectedId: string | null
  onOpenEvent: (id: string) => void
}

export function EventFeed(props: FeedProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} fallback={({ reset }) => <FeedError onRetry={reset} />}>
          <Suspense fallback={<EventFeedSkeleton />}>
            <EventFeedContent {...props} />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

function EventFeedContent({ startDate, genres, selectedId, onOpenEvent }: FeedProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } = useSuspenseInfiniteQuery(
    eventsInfiniteQueryOptions(startDate),
  )

  const days = useMemo(() => {
    const rangeEnd = data.pages.at(-1)?.end ?? startDate
    const events = flattenEvents(data.pages).filter((event) => matchesGenres(event.genres, genres))
    return groupByDay(events, startDate, rangeEnd)
  }, [data.pages, startDate, genres])

  // Sentinela ~600px antes do fim da lista: busca mais 2 semanas antes de o usuário chegar lá.
  // Se depois da busca ele continuar visível (poucos eventos), o observer dispara de novo.
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage || isFetchingNextPage || isFetchNextPageError) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void fetchNextPage()
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

  return (
    <div className="space-y-6" aria-busy={isFetchingNextPage}>
      {days.length === 0 && !hasNextPage && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-fg-muted">
          <CalendarX className="size-12" aria-hidden="true" />
          <p className="text-sm">
            {genres.length > 0
              ? `Nenhum evento de ${genres.join(', ')} a partir desta data.`
              : 'Nenhum evento encontrado a partir desta data.'}
          </p>
        </div>
      )}

      {/* Uma grade só: o cabeçalho do dia ocupa a linha inteira e os cards seguem em 2 colunas
          a partir de `xl`. `data-day` é usado pela navegação por dia (useDayNavigation). */}
      {days.length > 0 && (
        <div className={GRID}>
          {days.map(({ day, events }, index) => (
            <Fragment key={day}>
              <h2
                id={`day-${day}`}
                data-day={day}
                className={`col-span-full text-sm font-semibold text-fg-muted ${index > 0 ? 'pt-3 xl:pt-2' : ''}`}
              >
                {formatDayHeading(day)}
              </h2>
              {events.map((event) => (
                <EventCard
                  key={`${day}-${event.id}`}
                  event={event}
                  selected={event.id === selectedId}
                  onOpen={onOpenEvent}
                />
              ))}
            </Fragment>
          ))}
        </div>
      )}

      {isFetchingNextPage && (
        <div className={GRID}>
          <span className="sr-only">Carregando mais eventos…</span>
          <EventCardSkeleton />
          <EventCardSkeleton className="hidden xl:flex" />
        </div>
      )}

      <div ref={sentinelRef} />

      {isFetchNextPageError ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-fg-muted">Não foi possível carregar mais eventos.</p>
          <Button variant="secondary" onClick={() => fetchNextPage()}>
            Tentar de novo
          </Button>
        </div>
      ) : hasNextPage ? (
        !isFetchingNextPage && (
          <div className="flex justify-center">
            <Button variant="secondary" onClick={() => fetchNextPage()}>
              Carregar mais 2 semanas
            </Button>
          </div>
        )
      ) : (
        days.length > 0 && <p className="text-center text-sm text-fg-muted">Sem mais eventos por enquanto.</p>
      )}
    </div>
  )
}

/** Primeiro carregamento: 4 cards no mobile, 6 em 2 colunas a partir de `xl`. */
function EventFeedSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Carregando eventos…</span>
      <div aria-hidden="true" className="h-5 w-32 animate-pulse rounded-md bg-genre-neutral" />
      <div className={GRID}>
        {Array.from({ length: 6 }, (_, i) => (
          <EventCardSkeleton key={i} className={i >= 4 ? 'hidden xl:flex' : ''} />
        ))}
      </div>
    </div>
  )
}

function FeedError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-12 text-center">
      <p className="text-sm text-fg-muted">Não foi possível carregar os eventos.</p>
      <Button onClick={onRetry}>Tentar de novo</Button>
    </div>
  )
}
