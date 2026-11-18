import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { type IsoDate, lisbonDate } from '../data/dates'
import { eventsInfiniteQueryOptions, flattenEvents } from '../data/queries'
import { agendaOf } from '../domain/agenda'
import { visibleGenres } from '../domain/genres'
import { useAgenda } from '../features/agenda/agendaContext'
import { formatDayHeading, formatTimeRange } from '../features/events/format'
import { useEventBySlug } from '../features/events/useEventBySlug'
import { useI18n } from '../i18n/useI18n'
import { eventJsonLd, eventListJsonLd } from './eventJsonLd'
import { eventUrl, siteUrl, useDocumentHead } from './useDocumentHead'

/** Quantos eventos entram na lista estruturada da página inicial. */
const LIST_SIZE = 20

/**
 * <head> da página Dança: sem evento aberto, a agenda (com a lista dos próximos eventos em
 * JSON-LD); com evento aberto, título, descrição e Schema.org Event dele. Filtros e data não
 * mudam a URL canônica (são variações da mesma agenda).
 */
export function DanceHead({ startDate, selectedSlug }: { startDate: IsoDate; selectedSlug: string | null }) {
  const { t, locale } = useI18n()
  const agenda = useAgenda()
  const { data } = useInfiniteQuery(eventsInfiniteQueryOptions(startDate))
  const event = useEventBySlug(startDate, selectedSlug)
  const upcoming = useMemo(
    () => flattenEvents(data?.pages ?? []).filter((item) => agendaOf(item.genres) === agenda).slice(0, LIST_SIZE),
    [data, agenda],
  )
  // Agenda da página: dança (/) ou danças tradicionais (/tradicionais/).
  const home =
    agenda === 'tradicionais'
      ? { title: t.seo.tradicionaisTitle, description: t.seo.tradicionaisDescription, canonical: `${siteUrl()}tradicionais/` }
      : { title: t.seo.homeTitle, description: t.seo.homeDescription, canonical: siteUrl() }

  let head
  if (selectedSlug && event) {
    const day = formatDayHeading(lisbonDate(event.start), locale)
    head = {
      title: t.seo.eventTitle(event.title, day),
      description: [visibleGenres(event.genres).join(', '), `${day}, ${formatTimeRange(event, locale)}`, event.venue?.name]
        .filter(Boolean)
        .join(' · '),
      canonical: eventUrl(event),
      jsonLd: eventJsonLd(event, eventUrl(event)),
    }
  } else if (selectedSlug && event === null) {
    // Evento que não existe mais (ou fora das datas carregadas): não indexar; aponta para a agenda.
    head = { title: t.seo.eventNotFoundTitle, description: home.description, canonical: home.canonical, noindex: true }
  } else {
    head = {
      ...home,
      ...(upcoming.length > 0 ? { jsonLd: eventListJsonLd(upcoming, (e) => eventUrl(e)) } : {}),
    }
  }

  useDocumentHead(head)
  return null
}
