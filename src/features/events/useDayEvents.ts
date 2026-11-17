import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { IsoDate } from '../../data/dates'
import { eventsInfiniteQueryOptions, flattenEvents } from '../../data/queries'
import type { DanceEvent } from '../../domain/event'
import { matchesGenres } from '../../domain/genreFilter'
import type { Genre } from '../../domain/genres'
import { groupByDay } from './groupByDay'

/** Eventos de um dia do feed, já com o filtro de gêneros (mesma regra da lista). */
export function useDayEvents(startDate: IsoDate, day: IsoDate, genres: readonly Genre[]) {
  const { data, isPending } = useInfiniteQuery(eventsInfiniteQueryOptions(startDate))

  const events = useMemo((): DanceEvent[] => {
    const pages = data?.pages ?? []
    const rangeEnd = pages.at(-1)?.end ?? startDate
    const filtered = flattenEvents(pages).filter((event) => matchesGenres(event.genres, genres))
    return groupByDay(filtered, startDate, rangeEnd).find((group) => group.day === day)?.events ?? []
  }, [data, startDate, day, genres])

  return { events, isPending }
}
