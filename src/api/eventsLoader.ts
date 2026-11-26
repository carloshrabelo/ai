import { type LoaderFunctionArgs, replace } from 'react-router'
import { toDanceEvent } from '../domain/event'
import { canonicalGenresSearch, toSearchString } from '../domain/genreFilter'
import { slugDate } from '../domain/slug'
import { WINDOW_DAYS } from './config'
import { addDays, agendaToday, type IsoDate, isIsoDate } from '../lib/dates'
import { seedInitialEvents } from './initialEvents'
import { seedSwrEvents } from './swrEvents'
import { eventsInfiniteQueryOptions } from './queries'
import { queryClient } from './queryClient'

export type EventsLoaderData = {
  /** Primeiro dia do feed (?date= ou o "hoje" da agenda). */
  startDate: IsoDate
  /** "Hoje" da agenda para os atalhos (Lisboa; até as 05:00 ainda é o dia anterior, ver agendaToday). */
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
  // Até as 05:00, "hoje" ainda é o dia anterior (ver agendaToday).
  const today = agendaToday()
  const startDate = isIsoDate(param) ? param : today

  // Link direto para um evento fora da primeira janela (ex.: semana que vem, ou já passou):
  // o feed começa no dia do evento, para ele estar entre os carregados.
  const day = typeof params.slug === 'string' ? slugDate(params.slug) : undefined
  if (day && !isIsoDate(param) && !inFirstWindow(day, startDate) && !isCached(startDate, params.slug!)) {
    url.searchParams.set('date', day)
    return replace(`${appPath(url.pathname)}${toSearchString(url.searchParams)}`)
  }

  // Primeira janela embutida no HTML (build): os cards aparecem sem esperar a API, que atualiza em seguida.
  seedInitialEvents(queryClient, startDate)
  void queryClient.prefetchInfiniteQuery(eventsInfiniteQueryOptions(startDate))
  // Eventos de até 2 horas atrás (cron): aparecem antes da API, que os substitui quando responder.
  void seedSwrEvents(queryClient, startDate)

  return { startDate, today }
}

/** Caminho sem o basename do deploy (hoje "/", na raiz do domínio), como o router espera. */
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
