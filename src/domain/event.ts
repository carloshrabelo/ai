import venues from '../data/venues.json'
import { lisbonMidnight } from '../data/dates'
import type { GCalDateTime, GCalEvent } from '../data/googleCalendar'
import { expandGenres, GENRES, type Genre } from './genres'
import { genresInText } from './parseGenres'
import { parseSummary } from './parseSummary'

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
}

type VenueCoords = { name: string; lat: number; lng: number }
const VENUES: Record<string, VenueCoords> = venues

export function toDanceEvent(event: GCalEvent): DanceEvent {
  const { genres: tagGenres, rawTag, title, price } = parseSummary(event.summary)
  const description = event.description?.trim() || undefined
  // A tag do título é a fonte principal; gêneros citados no título ou na descrição completam
  // (ex.: tag "Bachata & Kizomba" com "70% Bachata / 30% Salsa" na descrição → inclui Salsa).
  // Não repete o que a tag já inclui: "Latinas" com Salsa na descrição continua só "Latinas".
  const implied = expandGenres(tagGenres)
  const textGenres = genresInText(`${title}\n${plainText(description)}`).filter((genre) => !implied.has(genre))
  const genres = GENRES.filter((genre) => tagGenres.includes(genre) || textGenres.includes(genre))

  return {
    id: event.id,
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

/** HTML da descrição → texto, só para procurar gêneros. */
function plainText(html: string | undefined): string {
  return (html ?? '').replace(/<[^>]*>/g, ' ').replaceAll('&amp;', '&').replaceAll('&nbsp;', ' ')
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
