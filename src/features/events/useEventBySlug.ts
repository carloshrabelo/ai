import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { IsoDate } from '../../data/dates'
import { eventsInfiniteQueryOptions, flattenEvents } from '../../data/queries'
import type { DanceEvent } from '../../domain/event'

/** Evento pelo slug (ou id), a partir do cache do feed. undefined enquanto carrega; null se não existe (ou sem chave). */
export function useEventBySlug(startDate: IsoDate, slug: string | null, by: 'slug' | 'id' = 'slug'): DanceEvent | null | undefined {
  const { data, isPending } = useInfiniteQuery(eventsInfiniteQueryOptions(startDate))
  return useMemo(() => {
    if (!slug) return null
    if (isPending) return undefined
    return flattenEvents(data?.pages ?? []).find((event) => event[by] === slug) ?? null
  }, [data, isPending, slug, by])
}
