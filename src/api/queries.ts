import { type InfiniteData, infiniteQueryOptions } from '@tanstack/react-query'
import { type DanceEvent, toDanceEvent } from '../domain/event'
import { EMPTY_WINDOWS_TO_STOP, WINDOW_DAYS } from './config'
import { addDays, type IsoDate, lisbonMidnight } from '../lib/dates'
import type { GCalEvent } from '../domain/gcal'
import { fetchEvents } from './googleCalendar'

/** Uma janela de WINDOW_DAYS dias: [start, end), como veio da fonte. */
export type EventsPage = {
  start: IsoDate
  end: IsoDate
  items: GCalEvent[]
}

/** A mesma janela com os eventos já normalizados. */
export type DanceEventsPage = {
  start: IsoDate
  end: IsoDate
  events: DanceEvent[]
}

// Fora da função para manter a referência estável e o TanStack memoizar o resultado.
function selectDanceEvents(data: InfiniteData<EventsPage, IsoDate>): InfiniteData<DanceEventsPage, IsoDate> {
  return {
    ...data,
    pages: data.pages.map(({ start, end, items }) => ({ start, end, events: items.map(toDanceEvent) })),
  }
}

/** Feed de eventos a partir de startDate, em janelas de 2 semanas. */
export function eventsInfiniteQueryOptions(startDate: IsoDate) {
  return infiniteQueryOptions({
    queryKey: ['events', startDate],
    initialPageParam: startDate,
    queryFn: async ({ pageParam, signal }): Promise<EventsPage> => {
      const end = addDays(pageParam, WINDOW_DAYS)
      const items = await fetchEvents({
        timeMin: lisbonMidnight(pageParam),
        timeMax: lisbonMidnight(end),
        signal,
      })
      return { start: pageParam, end, items }
    },
    getNextPageParam: (lastPage, allPages) => {
      const tail = allPages.slice(-EMPTY_WINDOWS_TO_STOP)
      const reachedEnd = tail.length === EMPTY_WINDOWS_TO_STOP && tail.every((page) => page.items.length === 0)
      return reachedEnd ? undefined : lastPage.end
    },
    select: selectDanceEvents,
  })
}

/** Junta as janelas numa lista só. Eventos de vários dias podem vir em duas janelas. */
export function flattenEvents(pages: DanceEventsPage[]): DanceEvent[] {
  const seen = new Set<string>()
  return pages
    .flatMap((page) => page.events)
    .filter((event) => {
      if (seen.has(event.id)) return false
      seen.add(event.id)
      return true
    })
}
