import { type DanceEvent, toDanceEvent } from '../domain/event'
import { WINDOW_DAYS } from './config'
import { addDays, type IsoDate, lisbonMidnight } from './dates'
import { fetchEvents } from './googleCalendar'

/** Eventos de [from, to), janela a janela (como o app busca), sem repetidos e ordenados pelo início. */
export async function loadEvents(from: IsoDate, to: IsoDate, signal?: AbortSignal): Promise<DanceEvent[]> {
  const byId = new Map<string, DanceEvent>()
  for (let start = from; start < to; start = addDays(start, WINDOW_DAYS)) {
    const end = addDays(start, WINDOW_DAYS) < to ? addDays(start, WINDOW_DAYS) : to
    const items = await fetchEvents({ timeMin: lisbonMidnight(start), timeMax: lisbonMidnight(end), signal })
    for (const item of items) if (!byId.has(item.id)) byId.set(item.id, toDanceEvent(item))
  }
  return [...byId.values()].sort((a, b) => a.start.getTime() - b.start.getTime())
}
