import { useSyncExternalStore } from 'react'
import type { DanceEvent } from '../../domain/event'
import { type EventChange, type EventSnapshot, snapshotOf } from './changes'

/**
 * Eventos que a pessoa adicionou ao calendário, guardados no aparelho (localStorage) como
 * estavam naquele momento. Ao carregar os eventos, o app compara e avisa o que mudou.
 */
const STORAGE_KEY = 'tracked-events'
/** Depois do fim do evento, deixa de acompanhar. */
const KEEP_AFTER_END_MS = 24 * 60 * 60_000

type Store = Record<string, EventSnapshot>

function read(): Store {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Store
    const now = Date.now()
    // Descarta eventos que já acabaram.
    return Object.fromEntries(Object.entries(parsed).filter(([, s]) => new Date(s.end).getTime() + KEEP_AFTER_END_MS > now))
  } catch {
    return {}
  }
}

let store: Store = typeof localStorage === 'undefined' ? {} : read()
let snapshots: EventSnapshot[] = Object.values(store)
const listeners = new Set<() => void>()

function save(next: Store) {
  store = next
  snapshots = Object.values(next)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Sem storage: vale só nesta sessão.
  }
  for (const listener of listeners) listener()
}

/** Começa (ou atualiza) o acompanhamento com o estado atual do evento. */
export function trackEvent(event: DanceEvent) {
  save({ ...store, [event.id]: snapshotOf(event) })
}

export function untrackEvent(id: string) {
  const { [id]: _, ...rest } = store
  save(rest)
}

/** "Ok" no aviso: passa a considerar o estado novo (ou para de acompanhar, se foi removido). */
export function acknowledgeChange(change: EventChange) {
  if (change.kind === 'removed' || !change.after) untrackEvent(change.id)
  else save({ ...store, [change.id]: change.after })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTrackedSnapshots(): EventSnapshot[] {
  return useSyncExternalStore(subscribe, () => snapshots)
}

export function useIsTracked(id: string): boolean {
  return useSyncExternalStore(subscribe, () => id in store)
}
