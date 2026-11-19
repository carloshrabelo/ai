import { useSyncExternalStore } from 'react'

// Um relógio só para o app inteiro, que avisa a cada minuto (selos "Agora" e "Encerrado" dos cards).
const MINUTE = 60_000
let now = Date.now()
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  timer ??= setInterval(() => {
    now = Date.now()
    for (const listener of listeners) listener()
  }, MINUTE)
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

/** Hora atual (ms), atualizada a cada minuto. */
export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => now,
  )
}
