import { addDays, type IsoDate, lisbonMidnight } from '../data/dates'
import type { GCalEvent } from '../data/googleCalendar'

// Calendários além do principal (pasdedeux.pt). Cada um tem o próprio formato; o adaptador converte
// o evento para o formato do principal ("Tag • Nome • Preço" no título, local em `location`, hora em
// `dateTime`), e o resto do app (gêneros, preço, local, mapa) funciona igual.

/** Calendário de onde veio cada evento (para a revisão por responsável, em /review). */
export const CALENDAR_SOURCES = ['pasdedeux', 'tangolx', 'tradicionais'] as const
export type CalendarSource = (typeof CALENDAR_SOURCES)[number]

export const SOURCE_INFO: Record<CalendarSource, { label: string; owner: string }> = {
  pasdedeux: { label: 'Pas de Deux', owner: '@ateterca' },
  tangolx: { label: 'Tango (tangolx.com)', owner: 'tangolx.com' },
  tradicionais: { label: 'Danças tradicionais', owner: 'Luís Manuel Guerra' },
}

/** Prefixo de situação ("(Cancelado) …") fica na frente da tag, onde o parseSummary procura. */
const STATUS_PREFIX = /^\s*[([]\s*(?:canc\w*|postponed|adiad[oa])\s*[)\]]\s*/i

function withTag(tag: string, summary: string, price?: string): string {
  const status = summary.match(STATUS_PREFIX)?.[0] ?? ''
  const title = summary.slice(status.length).trim() || 'Sem título'
  return `${status}${tag} • ${title}${price ? ` • ${price}` : ''}`
}

/** HTML da descrição → linhas de texto. */
function lines(html: string | undefined): string[] {
  return (html ?? '')
    .replace(/<br\s*\/?>|<\/(?:p|div|li)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replaceAll('&amp;', '&')
    .replaceAll('&nbsp;', ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

/** Valor de "Rótulo: valor" nas linhas da descrição. */
function field(rows: string[], label: RegExp): string | undefined {
  for (const row of rows) {
    const match = row.match(new RegExp(`^(?:${label.source})\\s*:\\s*(.*)$`, 'i'))
    if (match) return match[1].trim() || undefined
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Danças tradicionais europeias (europeias.agenda@gmail.com)
//
// Título "Nome | Cidade" (às vezes "Nome | Data | CIDADE"), local em `location`, hora normal.

export const TRADICIONAIS_CALENDAR_ID = 'europeias.agenda@gmail.com'

export function fromTradicionais(event: GCalEvent): GCalEvent {
  const parts = (event.summary ?? '').split(/\s+\|\s+/).map((part) => part.trim())
  const [title] = parts
  const city = parts.length > 1 ? parts.at(-1) : undefined
  const venue = event.location?.trim()
  // A cidade ajuda a achar o local no mapa ("Teatro da Luz" → "Teatro da Luz, Lisboa").
  const location = venue && city && !venue.toLowerCase().includes(city.toLowerCase().split(' [')[0]) ? `${venue}, ${city}` : (venue ?? city)
  return {
    ...event,
    summary: withTag('Tradicionais', title ?? ''),
    ...(location ? { location } : {}),
  }
}

// ---------------------------------------------------------------------------
// Tango (agendatangolx@gmail.com)
//
// Eventos de dia inteiro; hora, local e entrada vêm na descrição:
//   Time: 20h00-22:30 / Where: LAGAR S. VICENTE - R. Prof. Francisco Gentil 33, 1600-622 Lisboa /
//   Entrance: 6€ / DJ: …

export const TANGO_CALENDAR_ID = 'agendatangolx@gmail.com'

const TIME = /(\d{1,2})\s*[h:]\s*(\d{2})?\s*(?:-|–|—|to|às|a)\s*(\d{1,2})\s*[h:]*\s*(\d{2})?/i

/** "20h00-22:30" → minutos desde a meia-noite (início, fim). Fim antes do início = dia seguinte. */
export function parseTimeRange(text: string): { start: number; end: number } | undefined {
  const match = text.match(TIME)
  if (!match) return undefined
  const start = Number(match[1]) * 60 + Number(match[2] ?? 0)
  let end = Number(match[3]) * 60 + Number(match[4] ?? 0)
  if (start >= 24 * 60 || end > 24 * 60) return undefined
  if (end <= start) end += 24 * 60
  return { start, end }
}

/** Instante em Lisboa: data + minutos (passando de 24h, vai para o dia seguinte). */
function lisbonAt(date: IsoDate, minutes: number): string {
  const day = addDays(date, Math.floor(minutes / (24 * 60)))
  return new Date(lisbonMidnight(day).getTime() + (minutes % (24 * 60)) * 60_000).toISOString()
}

// " - " antes de um endereço separa nome e endereço ("LAGAR S. VICENTE - R. Prof. …"); fora disso é
// parte do nome ("BUS - Paragem Cultural").
const DASH_BEFORE_ADDRESS = /\s+-\s+(?=(?:R\.|Rua|Av\.?|Avenida|Largo|Travessa|Tv\.|Pra[cç]a|P[cç]\.|Estrada|Cal[cç]ada|Alameda|\d))/gi

/** "Teatro A Barraca—Bar A Barraca—Largo de Santos, 2, Lisboa" → partes separadas por vírgula. */
function cleanWhere(where: string): string {
  return where
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(DASH_BEFORE_ADDRESS, ', ')
    .replace(/\s*,\s*(,\s*)+/g, ', ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
}

// Só vai para o título o que parece preço (o parseSummary trata o resto como parte do nome).
const PRICE_LIKE = /€|\bfree\b|gr[aá]tis|gratuit|donat|doa[cç][aã]o|contribui/i

export function fromTangoLx(event: GCalEvent): GCalEvent {
  const rows = lines(event.description)
  const entrance = field(rows, /entrance|entrada|pre[cç]o/)
  const where = field(rows, /where|onde|local/)
  const time = field(rows, /time|hora|hor[aá]rio/)
  const range = time ? parseTimeRange(time) : undefined
  const date = event.start.date as IsoDate | undefined

  return {
    ...event,
    summary: withTag('Tango', event.summary ?? '', entrance && PRICE_LIKE.test(entrance) ? entrance : undefined),
    ...(!event.location && where ? { location: cleanWhere(where) } : {}),
    // Dia inteiro com hora na descrição → evento com hora de verdade.
    ...(date && range
      ? {
          start: { dateTime: lisbonAt(date, range.start), timeZone: 'Europe/Lisbon' },
          end: { dateTime: lisbonAt(date, range.end), timeZone: 'Europe/Lisbon' },
        }
      : {}),
  }
}
