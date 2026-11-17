import { infiniteQueryOptions } from '@tanstack/react-query'
import { EMPTY_WINDOWS_TO_STOP, WINDOW_DAYS } from './config'
import { addDays, type IsoDate, lisbonMidnight } from './dates'
import { fetchEvents, type GCalEvent } from './googleCalendar'

/** Uma janela de WINDOW_DAYS dias: [start, end). */
export type EventsPage = {
  start: IsoDate
  end: IsoDate
  items: GCalEvent[]
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
  })
}

/** Junta as janelas numa lista só. Eventos de vários dias podem vir em duas janelas. */
export function flattenEvents(pages: EventsPage[]): GCalEvent[] {
  const seen = new Set<string>()
  return pages
    .flatMap((page) => page.items)
    .filter((event) => {
      if (seen.has(event.id)) return false
      seen.add(event.id)
      return true
    })
}
