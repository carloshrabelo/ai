import type { DanceEvent } from '../domain/event'
import { visibleGenres } from '../domain/genres'

/** Schema.org Event (https://schema.org/Event) de um evento, para o Google entender a página. */
export function eventJsonLd(event: DanceEvent, url: string): Record<string, unknown> {
  const status = event.status === 'cancelled' ? 'EventCancelled' : event.status === 'postponed' ? 'EventPostponed' : 'EventScheduled'
  const price = parsePrice(event.price)
  return {
    '@context': 'https://schema.org',
    '@type': 'DanceEvent',
    name: event.title,
    startDate: isoFor(event.start, event.allDay),
    endDate: isoFor(event.end, event.allDay),
    eventStatus: `https://schema.org/${status}`,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url,
    ...(event.description ? { description: plainText(event.description).slice(0, 500) } : {}),
    ...(event.genres.length > 0 ? { keywords: visibleGenres(event.genres).join(', ') } : {}),
    ...(event.venue
      ? {
          location: {
            '@type': 'Place',
            name: event.venue.name,
            address: event.venue.address || event.venue.name,
            ...(event.venue.lat !== undefined && event.venue.lng !== undefined
              ? { geo: { '@type': 'GeoCoordinates', latitude: event.venue.lat, longitude: event.venue.lng } }
              : {}),
          },
        }
      : {}),
    // Só quando o preço é um valor simples ("5€", "10 €"); textos como "5€ ou 7€" ficam de fora.
    ...(price !== undefined ? { offers: { '@type': 'Offer', price, priceCurrency: 'EUR', url } } : {}),
  }
}

/** Lista de eventos (página inicial). */
export function eventListJsonLd(events: readonly DanceEvent[], urlFor: (event: DanceEvent) => string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: eventJsonLd(event, urlFor(event)),
    })),
  }
}

/** Evento de dia inteiro vira só a data (YYYY-MM-DD); com hora, data e hora ISO. */
function isoFor(date: Date, allDay: boolean): string {
  if (!allDay) return date.toISOString()
  // Meia-noite de Lisboa → a data de Lisboa.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(date)
}

export function parsePrice(text: string | undefined): number | undefined {
  const match = text?.trim().match(/^(\d+(?:[.,]\d{1,2})?)\s*€$/)
  return match ? Number(match[1].replace(',', '.')) : undefined
}

function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replaceAll('&amp;', '&')
    .replace(/[ \t]+/g, ' ')
    .trim()
}
