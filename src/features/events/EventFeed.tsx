import { CalendarXIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { QueryErrorResetBoundary, useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { Button } from '../../components/ui/Button'
import type { IsoDate } from '../../lib/dates'
import { eventsInfiniteQueryOptions, flattenEvents } from '../../api/queries'
import { type GenreFilterValue, matchesGenres } from '../../domain/genreFilter'
import { EventCard, EventCardSkeleton } from './EventCard'
import { lastSearchedDay, shouldPauseFilteredSearch } from './filteredSearch'
import { formatDayHeading, formatDayInSentence } from './format'
import { useI18n } from '../../i18n/useI18n'
import { genreLabel } from '../genres/genreLabel'
import { groupByDay } from './groupByDay'

const GRID = 'grid grid-cols-1 gap-3 xl:grid-cols-2 xl:gap-4'

/** Feed de eventos agrupado por dia, com skeleton, erro isolado e scroll infinito. */
type FeedProps = {
  startDate: IsoDate
  /** Gêneros do filtro (vazio = todos). */
  genres: readonly GenreFilterValue[]
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

function EventFeedContent({ startDate, genres, onOpenEvent }: FeedProps) {
  const { t, locale, orList } = useI18n()
  const genreNames = orList(genres.map((genre) => genreLabel(genre, t)))
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } = useSuspenseInfiniteQuery(
    eventsInfiniteQueryOptions(startDate),
  )

  const days = useMemo(() => {
    const rangeEnd = data.pages.at(-1)?.end ?? startDate
    const events = flattenEvents(data.pages).filter((event) => matchesGenres(event.genres, genres))
    return groupByDay(events, startDate, rangeEnd)
  }, [data.pages, startDate, genres])

  // Com filtro ativo, a busca automática para depois de 3 janelas seguidas sem resultado.
  // "Buscar mais" libera mais 3 a partir dali; trocar o filtro recomeça a contagem.
  const filterKey = genres.join(',')
  const [resume, setResume] = useState({ filterKey, fromPage: 0 })
  const fromPage = resume.filterKey === filterKey ? resume.fromPage : 0
  const paused = hasNextPage && shouldPauseFilteredSearch(data.pages, genres, fromPage)
  const searchMore = () => {
    setResume({ filterKey, fromPage: data.pages.length })
    void fetchNextPage()
  }

  // Sentinela ~600px antes do fim da lista: busca mais 2 semanas antes de o usuário chegar lá.
  // Se depois da busca ele continuar visível (poucos eventos), o observer dispara de novo.
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage || isFetchingNextPage || isFetchNextPageError || paused) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void fetchNextPage()
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage, paused])

  return (
    <div className="space-y-6" aria-busy={isFetchingNextPage}>
      {days.length === 0 && !hasNextPage && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-fg-muted">
          <CalendarXIcon className="size-12" aria-hidden="true" />
          <p className="text-sm">{genres.length > 0 ? t.feed.emptyForGenres(genreNames) : t.feed.emptyFromDate}</p>
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
                {formatDayHeading(day, locale)}
              </h2>
              {events.map((event) => (
                <EventCard key={`${day}-${event.id}`} event={event} onOpen={onOpenEvent} />
              ))}
            </Fragment>
          ))}
        </div>
      )}

      {isFetchingNextPage && (
        <div className={GRID}>
          <span className="sr-only">{t.feed.loadingMore}</span>
          <EventCardSkeleton />
          <EventCardSkeleton className="hidden xl:flex" />
        </div>
      )}

      <div ref={sentinelRef} />

      {isFetchNextPageError ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-fg-muted">{t.feed.loadMoreError}</p>
          <Button variant="secondary" onClick={() => fetchNextPage()}>
            {t.feed.retry}
          </Button>
        </div>
      ) : paused && !isFetchingNextPage ? (
        <div role="status" className="flex flex-col items-center gap-2 py-4 text-center">
          <MagnifyingGlassIcon className="size-8 text-fg-muted" aria-hidden="true" />
          <p className="text-sm text-fg-muted">
            {(days.length === 0 ? t.feed.pausedNone : t.feed.pausedNoOther)(
              genreNames,
              formatDayInSentence(lastSearchedDay(data.pages, startDate), locale),
            )}
          </p>
          <Button variant="secondary" onClick={searchMore}>
            {t.feed.searchMore}
          </Button>
        </div>
      ) : hasNextPage ? (
        !isFetchingNextPage && (
          <div className="flex justify-center">
            <Button variant="secondary" onClick={() => fetchNextPage()}>
              {t.feed.loadMore}
            </Button>
          </div>
        )
      ) : (
        days.length > 0 && <p className="text-center text-sm text-fg-muted">{t.feed.noMore}</p>
      )}
    </div>
  )
}

/** Primeiro carregamento: 4 cards no mobile, 6 em 2 colunas a partir de `xl`. */
function EventFeedSkeleton() {
  const { t } = useI18n()
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">{t.feed.loading}</span>
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
  const { t } = useI18n()
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-12 text-center">
      <p className="text-sm text-fg-muted">{t.feed.loadError}</p>
      <Button onClick={onRetry}>{t.feed.retry}</Button>
    </div>
  )
}
