import { type LoaderFunctionArgs, replace } from 'react-router'
import { toDanceEvent } from '../domain/event'
import { canonicalGenresSearch, toSearchString } from '../domain/genreFilter'
import { slugDate } from '../domain/slug'
import { WINDOW_DAYS } from './config'
import { addDays, type IsoDate, isIsoDate, todayIso } from './dates'
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
export function eventsLoader({ request, params }: LoaderFunctionArgs): EventsLoaderData | Response {
  const url = new URL(request.url)

  // ?genres= fora do formato canônico (caixa alta, acento, inválidos): troca a URL, sem novo item no histórico.
  const canonical = canonicalGenresSearch(url.searchParams)
  if (canonical) return replace(`${appPath(url.pathname)}${toSearchString(canonical)}`)

  const param = url.searchParams.get('date')
  const today = todayIso()
  const startDate = isIsoDate(param) ? param : today

  // Link direto para um evento fora da primeira janela (ex.: semana que vem, ou já passou):
  // o feed começa no dia do evento, para ele estar entre os carregados.
  const day = typeof params.slug === 'string' ? slugDate(params.slug) : undefined
  if (day && !isIsoDate(param) && !inFirstWindow(day, startDate) && !isCached(startDate, params.slug!)) {
    url.searchParams.set('date', day)
    return replace(`${appPath(url.pathname)}${toSearchString(url.searchParams)}`)
  }

  void queryClient.prefetchInfiniteQuery(eventsInfiniteQueryOptions(startDate))

  return { startDate, today }
}

/** Caminho sem o basename do deploy (ex.: /ai/ no GitHub Pages), como o router espera. */
function appPath(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return (base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname) || '/'
}

const inFirstWindow = (day: IsoDate, startDate: IsoDate) => day >= startDate && day < addDays(startDate, WINDOW_DAYS)

/** O evento já está no feed em cache (ex.: aberto pela lista depois de rolar algumas semanas)? */
function isCached(startDate: IsoDate, slug: string): boolean {
  const data = queryClient.getQueryData(eventsInfiniteQueryOptions(startDate).queryKey)
  return !!data?.pages.some((page) => page.items.some((item) => toDanceEvent(item).slug === slug))
}
