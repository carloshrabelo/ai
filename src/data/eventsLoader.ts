import type { LoaderFunctionArgs } from 'react-router'
import { type IsoDate, isIsoDate } from './dates'
import { getDefaultStartDate } from './googleCalendar'
import { eventsInfiniteQueryOptions } from './queries'
import { queryClient } from './queryClient'

export type EventsLoaderData = { startDate: IsoDate }

/**
 * Começa a buscar a primeira janela sem esperar por ela: a página abre na hora
 * e as áreas que dependem dos eventos mostram skeleton (Suspense).
 */
export async function eventsLoader({ request }: LoaderFunctionArgs): Promise<EventsLoaderData> {
  const param = new URL(request.url).searchParams.get('date')
  const startDate = isIsoDate(param) ? param : await getDefaultStartDate()

  void queryClient.prefetchInfiniteQuery(eventsInfiniteQueryOptions(startDate))

  return { startDate }
}
