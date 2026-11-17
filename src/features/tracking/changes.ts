import type { IsoDate } from '../../data/dates'
import type { DanceEvent } from '../../domain/event'

/** Como o evento estava quando a pessoa o adicionou ao calendário. */
export type EventSnapshot = {
  id: string
  title: string
  /** ISO */
  start: string
  end: string
  location: string
  status: 'scheduled' | 'cancelled' | 'postponed'
}

export type ChangeField = 'title' | 'time' | 'location' | 'status'

export type EventChange = {
  id: string
  /** Título salvo (o que a pessoa conhece). */
  title: string
  kind: 'changed' | 'removed'
  fields: ChangeField[]
  before: EventSnapshot
  /** Como está agora (ausente quando foi removido). */
  after?: EventSnapshot
}

export function snapshotOf(event: DanceEvent): EventSnapshot {
  return {
    id: event.id,
    title: event.title,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    location: event.venue?.location ?? '',
    status: event.status ?? 'scheduled',
  }
}

/** Janela já carregada: [start, end) em dias de Lisboa. */
export type LoadedRange = { start: IsoDate; end: IsoDate }

/**
 * Compara o que foi salvo com os eventos carregados.
 * - Evento encontrado com título, horário, local ou situação diferentes → "changed".
 * - Evento não encontrado, mas cujo dia está dentro de uma janela já carregada → "removed"
 *   (o calendário apagou ou trocou o evento). Fora das janelas carregadas não dá para saber.
 * `dayOf` converte o início salvo no dia de Lisboa.
 */
export function detectChanges(
  saved: readonly EventSnapshot[],
  events: readonly DanceEvent[],
  ranges: readonly LoadedRange[],
  dayOf: (iso: string) => IsoDate,
): EventChange[] {
  const byId = new Map(events.map((event) => [event.id, event]))
  const changes: EventChange[] = []

  for (const before of saved) {
    const current = byId.get(before.id)
    if (!current) {
      const day = dayOf(before.start)
      if (ranges.some((range) => day >= range.start && day < range.end)) {
        changes.push({ id: before.id, title: before.title, kind: 'removed', fields: [], before })
      }
      continue
    }
    const after = snapshotOf(current)
    const fields: ChangeField[] = []
    if (after.title !== before.title) fields.push('title')
    if (after.start !== before.start || after.end !== before.end) fields.push('time')
    if (after.location !== before.location) fields.push('location')
    if (after.status !== before.status) fields.push('status')
    if (fields.length > 0) changes.push({ id: before.id, title: before.title, kind: 'changed', fields, before, after })
  }
  return changes
}
