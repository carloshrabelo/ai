import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { IsoDate } from '../../data/dates'
import { eventsInfiniteQueryOptions, flattenEvents } from '../../data/queries'
import type { DanceEvent } from '../../domain/event'
import { agendaOf } from '../../domain/agenda'
import { type GenreFilterValue, matchesGenres } from '../../domain/genreFilter'
import { useAgenda } from '../agenda/agendaContext'
import { groupByDay } from './groupByDay'

/** Eventos de um dia do feed, da agenda da página e com o filtro de gêneros (mesma regra da lista). */
export function useDayEvents(startDate: IsoDate, day: IsoDate, genres: readonly GenreFilterValue[]) {
  const { data, isPending } = useInfiniteQuery(eventsInfiniteQueryOptions(startDate))
  const agenda = useAgenda()

  const events = useMemo((): DanceEvent[] => {
    const pages = data?.pages ?? []
    const rangeEnd = pages.at(-1)?.end ?? startDate
    const filtered = flattenEvents(pages).filter((event) => agendaOf(event.genres) === agenda && matchesGenres(event.genres, genres))
    return groupByDay(filtered, startDate, rangeEnd).find((group) => group.day === day)?.events ?? []
  }, [data, startDate, day, genres, agenda])

  return { events, isPending }
}
