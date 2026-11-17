import type { LoaderFunctionArgs } from 'react-router'
import { type IsoDate, isIsoDate, todayIso } from './dates'
import { eventsInfiniteQueryOptions } from './queries'
import { queryClient } from './queryClient'

export type EventsLoaderData = {
  /** Primeiro dia do feed (?date= ou hoje). */
  startDate: IsoDate
  /** "Hoje" para os atalhos (fuso de Lisboa). */
  today: IsoDate
}

/**
 * Começa a buscar a primeira janela sem esperar por ela: a página abre na hora
 * e as áreas que dependem dos eventos mostram skeleton (Suspense).
 */
export function eventsLoader({ request }: LoaderFunctionArgs): EventsLoaderData {
  const param = new URL(request.url).searchParams.get('date')
  const today = todayIso()
  const startDate = isIsoDate(param) ? param : today

  void queryClient.prefetchInfiniteQuery(eventsInfiniteQueryOptions(startDate))

  return { startDate, today }
}
