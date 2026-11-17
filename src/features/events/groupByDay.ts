import { addDays, type IsoDate, lisbonDate } from '../../data/dates'
import type { DanceEvent } from '../../domain/event'

export type EventDay = {
  day: IsoDate
  events: DanceEvent[]
}

/**
 * Agrupa por dia (fuso de Lisboa) dentro de [rangeStart, rangeEnd).
 * - Evento com hora aparece só no dia em que começa, mesmo passando da meia-noite.
 * - Evento de dia inteiro (festival) aparece em todos os dias do intervalo.
 * Dentro do dia: eventos de dia inteiro primeiro, depois por horário.
 */
export function groupByDay(events: DanceEvent[], rangeStart: IsoDate, rangeEnd: IsoDate): EventDay[] {
  const days = new Map<IsoDate, DanceEvent[]>()

  for (const event of events) {
    const first = lisbonDate(event.start)
    const last = event.allDay ? lisbonDate(new Date(event.end.getTime() - 1)) : first

    for (let day = first; day <= last; day = addDays(day, 1)) {
      if (day < rangeStart || day >= rangeEnd) continue
      const list = days.get(day) ?? []
      list.push(event)
      days.set(day, list)
    }
  }

  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, list]) => ({
      day,
      events: list.sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.getTime() - b.start.getTime()),
    }))
}
