import { TIME_ZONE } from '../../data/config'
import { type IsoDate, lisbonMidnight } from '../../data/dates'
import type { DanceEvent } from '../../domain/event'
import type { Locale } from '../../i18n/locale'
import { MESSAGES } from '../../i18n/messages'

// Datas e horas com Intl no idioma ativo, sempre no fuso de Lisboa (onde os eventos acontecem).
// Formatadores são caros de criar: um por idioma e formato.
const cache = new Map<string, Intl.DateTimeFormat>()

function formatter(locale: Locale, name: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${name}`
  let format = cache.get(key)
  if (!format) {
    format = new Intl.DateTimeFormat(locale, { ...options, timeZone: TIME_ZONE })
    cache.set(key, format)
  }
  return format
}

/** Relógio de 24h (pt-BR) usa hora com 2 dígitos ("04:00"); o de 12h (en-US), não ("4:00 AM"). */
const uses24h = (locale: Locale) =>
  ['h23', 'h24'].includes(new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle ?? '')
const time = (locale: Locale) => formatter(locale, 'time', { hour: uses24h(locale) ? '2-digit' : 'numeric', minute: '2-digit' })
const shortDate = (locale: Locale) => formatter(locale, 'shortDate', { day: '2-digit', month: '2-digit' })
const dayHeading = (locale: Locale) => formatter(locale, 'dayHeading', { weekday: 'long', day: '2-digit', month: '2-digit' })
const weekdayShort = (locale: Locale) => formatter(locale, 'weekdayShort', { weekday: 'short' })
const dayOfMonth = (locale: Locale) => formatter(locale, 'dayOfMonth', { day: 'numeric' })

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/**
 * pt-BR: "20:30 – 01:00"; en-US: "8:30 PM – 1:00 AM".
 * Dia inteiro: "Dia inteiro" / "All day", ou o intervalo de datas ("30/07 – 02/08" / "07/30 – 08/02").
 */
export function formatTimeRange(event: DanceEvent, locale: Locale): string {
  if (!event.allDay) return `${time(locale).format(event.start)} – ${time(locale).format(event.end)}`

  const lastDay = new Date(event.end.getTime() - 1) // fim exclusivo
  const dates = shortDate(locale)
  if (dates.format(event.start) === dates.format(lastDay)) return MESSAGES[locale].event.allDay
  return dates.formatRange(event.start, lastDay)
}

/** pt-BR: "Sábado, 11/07"; en-US: "Saturday, 07/11". */
export function formatDayHeading(day: IsoDate, locale: Locale): string {
  return capitalize(dayHeading(locale).format(lisbonMidnight(day)))
}

/** pt-BR: "Seg"; en-US: "Mon". */
export function formatWeekdayShort(day: IsoDate, locale: Locale): string {
  return capitalize(weekdayShort(locale).format(lisbonMidnight(day)).replace('.', ''))
}

/** "7" */
export function formatDayOfMonth(day: IsoDate, locale: Locale): string {
  return dayOfMonth(locale).format(lisbonMidnight(day))
}

/** pt-BR: "Qua, 22/09"; en-US: "Wed, 09/22". */
export function formatShortDay(day: IsoDate, locale: Locale): string {
  return `${formatWeekdayShort(day, locale)}, ${shortDate(locale).format(lisbonMidnight(day))}`
}

/** Data e hora do build, na página Info. */
export function formatDateTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

/** Dia no meio de uma frase: pt-BR "terça-feira, 17/11" (minúscula); en-US "Tuesday, 11/17". */
export function formatDayInSentence(day: IsoDate, locale: Locale): string {
  return dayHeading(locale).format(lisbonMidnight(day))
}
