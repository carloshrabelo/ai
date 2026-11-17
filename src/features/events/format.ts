import { TIME_ZONE } from '../../data/config'
import { type IsoDate, lisbonMidnight } from '../../data/dates'
import type { DanceEvent } from '../../domain/event'

// Horários sempre no fuso de Lisboa, onde os eventos acontecem.
const TIME = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE })
const SHORT_DATE = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: TIME_ZONE })
const DAY_HEADING = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  timeZone: TIME_ZONE,
})

/** "20:30 – 01:00" ou, para dia inteiro, "Dia inteiro" / "30/07 – 02/08". */
export function formatTimeRange(event: DanceEvent): string {
  if (!event.allDay) return `${TIME.format(event.start)} – ${TIME.format(event.end)}`

  const lastDay = new Date(event.end.getTime() - 1)
  const first = SHORT_DATE.format(event.start)
  const last = SHORT_DATE.format(lastDay)
  return first === last ? 'Dia inteiro' : `${first} – ${last}`
}

/** "Sábado, 11/07" */
export function formatDayHeading(day: IsoDate): string {
  const text = DAY_HEADING.format(lisbonMidnight(day))
  return text.charAt(0).toUpperCase() + text.slice(1)
}
