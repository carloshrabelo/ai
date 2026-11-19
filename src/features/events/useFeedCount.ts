import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { eventsInfiniteQueryOptions, flattenEvents } from '../../api/queries'
import { type GenreFilterValue, matchesGenres } from '../../domain/genreFilter'
import type { IsoDate } from '../../lib/dates'

/** Quantos eventos do feed (o que já foi carregado) passam pelo filtro de gêneros. */
export function useFeedCount(startDate: IsoDate, genres: readonly GenreFilterValue[]): number {
  const { data } = useInfiniteQuery(eventsInfiniteQueryOptions(startDate))
  return useMemo(() => flattenEvents(data?.pages ?? []).filter((event) => matchesGenres(event.genres, genres)).length, [data, genres])
}
