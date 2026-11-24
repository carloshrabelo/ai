import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { jsonCodec, legacyStorage } from '../../lib/persistStorage'
import type { DanceEvent } from '../../domain/event'
import { type EventChange, type EventSnapshot, snapshotOf } from './changes'

/**
 * Eventos que a pessoa adicionou ao calendário, guardados no aparelho (localStorage) como
 * estavam naquele momento. Ao carregar os eventos, o app compara e avisa o que mudou.
 */
const STORAGE_KEY = 'tracked-events'
/** Depois do fim do evento, deixa de acompanhar. */
const KEEP_AFTER_END_MS = 24 * 60 * 60_000

type Snapshots = Record<string, EventSnapshot>

const isSnapshots = (value: unknown): value is Snapshots => typeof value === 'object' && value !== null && !Array.isArray(value)

/** Descarta eventos que já acabaram. */
const withoutEnded = (snapshots: Snapshots, now = Date.now()): Snapshots =>
  Object.fromEntries(Object.entries(snapshots).filter(([, s]) => new Date(s.end).getTime() + KEEP_AFTER_END_MS > now))

const json = jsonCodec(isSnapshots)

/** Formato antigo mantido: `tracked-events` guarda o objeto { [id]: snapshot } em JSON, sem envelope. */
const useTrackedStore = create<{ snapshots: Snapshots }>()(
  persist(() => ({ snapshots: {} as Snapshots }), {
    name: STORAGE_KEY,
    storage: legacyStorage<{ snapshots: Snapshots }>({
      parse: (text) => {
        const snapshots = json.parse(text)
        return snapshots && { snapshots: withoutEnded(snapshots) }
      },
      serialize: ({ snapshots }) => json.serialize(snapshots),
    }),
  }),
)

const save = (snapshots: Snapshots) => useTrackedStore.setState({ snapshots })

/** Começa (ou atualiza) o acompanhamento com o estado atual do evento. */
export function trackEvent(event: DanceEvent) {
  save({ ...useTrackedStore.getState().snapshots, [event.id]: snapshotOf(event) })
}

export function untrackEvent(id: string) {
  const { [id]: _, ...rest } = useTrackedStore.getState().snapshots
  save(rest)
}

/** "Ok" no aviso: passa a considerar o estado novo (ou para de acompanhar, se foi removido). */
export function acknowledgeChange(change: EventChange) {
  if (change.kind === 'removed' || !change.after) untrackEvent(change.id)
  else save({ ...useTrackedStore.getState().snapshots, [change.id]: change.after })
}

export function useTrackedSnapshots(): EventSnapshot[] {
  const snapshots = useTrackedStore((state) => state.snapshots)
  return useMemo(() => Object.values(snapshots), [snapshots])
}

export function useIsTracked(id: string): boolean {
  return useTrackedStore((state) => id in state.snapshots)
}
