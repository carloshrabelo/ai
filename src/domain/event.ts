import venues from '../content/venues.json'
import { lisbonMidnight } from '../lib/dates'
import type { GCalDateTime, GCalEvent } from './gcal'
import type { CalendarSource } from './calendarSources'
import { confirmedUmbrellas, GENRES, type Genre } from './genres'
import { genresInText } from './parseGenres'
import { priceFromDescription } from './price/descriptionPrice'
import { type EventStatus, parseSummary } from './parseSummary'
import { eventSlug } from './slug'
import { htmlToText } from '../lib/text'

export type Venue = {
  /** Texto original do `location` no calendário (chave do venues.json e da geocodificação). */
  location: string
  name: string
  /** Texto do location sem o nome do local. '' quando o location é só o nome. */
  address: string
  lat?: number
  lng?: number
}

export type DanceEvent = {
  id: string
  /** Parte da URL do evento: /event/<slug>/ (ver domain/slug.ts). */
  slug: string
  /** Marcado no título do calendário como cancelado ou adiado. */
  status?: EventStatus
  title: string
  genres: Genre[]
  /** Tag original do summary, para exibir quando genres = []. */
  rawTag: string
  price?: string
  start: Date
  /** Exclusivo, como na API: um evento de dia inteiro em 30/07 termina em 31/07 00:00. */
  end: Date
  allDay: boolean
  venue?: Venue
  /** HTML vindo do calendário. Sanitizar antes de renderizar. */
  description?: string
  links: string[]
  calendarUrl: string
  /** Calendário de onde veio (pasdedeux, tangolx, tradicionais). */
  source: CalendarSource
}

type VenueCoords = { name: string; lat: number; lng: number }
const VENUES: Record<string, VenueCoords> = venues

export function toDanceEvent(event: GCalEvent): DanceEvent {
  const { genres: tagGenres, rawTag, title, price: titlePrice, status } = parseSummary(event.summary)
  const description = event.description?.trim() || undefined
  // Sem preço no título, procura na descrição ("12€ | 10€", "Entrada grátis", "Free entry"…).
  const price = titlePrice ?? priceFromDescription(description)
  // A tag do título é a fonte principal; gêneros citados no título ou na descrição completam
  // (ex.: tag "Bachata & Kizomba" com "70% Bachata / 30% Salsa" na descrição → inclui Salsa).
  // Inclusive os que a tag já implica: "Latinas" com Salsa e Bachata na descrição mostra os três.
  const text = `${title}\n${htmlToText(description, { tagSeparator: ' ' })}`
  const textGenres = genresInText(text)
  // Tag composta ("Afro-Latinas"): só as partes que o conteúdo confirma.
  const fromTag = confirmedUmbrellas(tagGenres, textGenres, text)
  const genres = GENRES.filter((genre) => fromTag.includes(genre) || textGenres.includes(genre))

  return {
    id: event.id,
    slug: eventSlug({ id: event.id, title, start: toDate(event.start) }),
    ...(status ? { status } : {}),
    title,
    genres,
    rawTag,
    ...(price ? { price } : {}),
    start: toDate(event.start),
    end: toDate(event.end),
    allDay: !event.start.dateTime,
    ...(event.location ? { venue: toVenue(event.location) } : {}),
    ...(description ? { description } : {}),
    links: extractLinks(description),
    calendarUrl: event.htmlLink,
    source: event.source ?? 'pasdedeux',
  }
}

function toDate(value: GCalDateTime): Date {
  if (value.dateTime) return new Date(value.dateTime)
  if (value.date) return lisbonMidnight(value.date)
  throw new Error('Evento sem data de início/fim.')
}

function toVenue(location: string): Venue {
  const [first, ...rest] = location.split(',').map((part) => part.trim())
  const known = VENUES[location]
  return {
    location,
    name: known?.name ?? first,
    address: rest.join(', '),
    ...(known ? { lat: known.lat, lng: known.lng } : {}),
  }
}

const URL_PATTERN = /https?:\/\/[^\s"'<>]+/g

/** Links da descrição, sem repetição e sem pontuação final colada. */
export function extractLinks(html: string | undefined): string[] {
  if (!html) return []
  const urls = html
    .replaceAll('&amp;', '&')
    .match(URL_PATTERN)
    ?.map((url) => url.replace(/[.,;:!?)\]]+$/, ''))
  return [...new Set(urls)]
}
