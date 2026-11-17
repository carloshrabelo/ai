import { type LoaderFunctionArgs, replace } from 'react-router'
import { canonicalGenresSearch, toSearchString } from '../domain/genreFilter'
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
export function eventsLoader({ request }: LoaderFunctionArgs): EventsLoaderData | Response {
  const url = new URL(request.url)

  // ?genres= fora do formato canônico (caixa alta, acento, inválidos): troca a URL, sem novo item no histórico.
  const canonical = canonicalGenresSearch(url.searchParams)
  if (canonical) return replace(`${appPath(url.pathname)}${toSearchString(canonical)}`)

  const param = url.searchParams.get('date')
  const today = todayIso()
  const startDate = isIsoDate(param) ? param : today

  void queryClient.prefetchInfiniteQuery(eventsInfiniteQueryOptions(startDate))

  return { startDate, today }
}

/** Caminho sem o basename do deploy (ex.: /ai/ no GitHub Pages), como o router espera. */
function appPath(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return (base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname) || '/'
}
