import type { DanceEvent } from '../../domain/event'

export type EventTiming = 'upcoming' | 'live' | 'ended'

/** Antes, durante ou depois do evento. Eventos de dia inteiro (festivais) não ganham selo. */
export function eventTiming(event: Pick<DanceEvent, 'start' | 'end' | 'allDay'>, now: number): EventTiming {
  if (event.allDay) return 'upcoming'
  if (now >= event.end.getTime()) return 'ended'
  if (now >= event.start.getTime()) return 'live'
  return 'upcoming'
}
