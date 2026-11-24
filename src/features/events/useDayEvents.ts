import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { IsoDate } from '../../lib/dates'
import { eventsInfiniteQueryOptions, flattenEvents } from '../../api/queries'
import type { DanceEvent } from '../../domain/event'
import { type GenreFilterValue, matchesGenres } from '../../domain/genreFilter'
import { groupByDay } from './groupByDay'

/** Eventos de um dia do feed, já com o filtro de gêneros (mesma regra da lista). */
export function useDayEvents(startDate: IsoDate, day: IsoDate, genres: readonly GenreFilterValue[]) {
  const { data, isPending, isError, refetch } = useInfiniteQuery(eventsInfiniteQueryOptions(startDate))

  const events = useMemo((): DanceEvent[] => {
    const pages = data?.pages ?? []
    const rangeEnd = pages.at(-1)?.end ?? startDate
    const filtered = flattenEvents(pages).filter((event) => matchesGenres(event.genres, genres))
    return groupByDay(filtered, startDate, rangeEnd).find((group) => group.day === day)?.events ?? []
  }, [data, startDate, day, genres])

  /** Fim (exclusivo) do que já foi carregado: dias a partir daqui ainda não têm eventos buscados. */
  const loadedEnd = data?.pages.at(-1)?.end

  return { events, isPending, isError, refetch, loadedEnd }
}
