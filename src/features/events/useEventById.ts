import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { IsoDate } from '../../data/dates'
import { eventsInfiniteQueryOptions, flattenEvents } from '../../data/queries'
import type { DanceEvent } from '../../domain/event'

/** Evento pelo id, a partir do cache do feed. undefined enquanto carrega; null se não existe (ou sem id). */
export function useEventById(startDate: IsoDate, id: string | null): DanceEvent | null | undefined {
  const { data, isPending } = useInfiniteQuery(eventsInfiniteQueryOptions(startDate))
  return useMemo(() => {
    if (!id) return null
    if (isPending) return undefined
    return flattenEvents(data?.pages ?? []).find((event) => event.id === id) ?? null
  }, [data, isPending, id])
}
