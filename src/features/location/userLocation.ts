import { useSyncExternalStore } from 'react'
import type { Coords } from './distance'

export type LocationState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'granted'; coords: Coords }
  | { status: 'denied' }
  | { status: 'unavailable' }

/**
 * Localização do usuário, compartilhada pelo app (cards, mapa, filtros).
 * Só pede permissão quando o usuário pede; se a permissão já foi dada antes, carrega sozinha.
 */
let state: LocationState = { status: 'idle' }
const listeners = new Set<() => void>()

function setState(next: LocationState) {
  state = next
  for (const listener of listeners) listener()
}

export function requestLocation() {
  if (!('geolocation' in navigator)) {
    setState({ status: 'unavailable' })
    return
  }
  if (state.status !== 'granted') setState({ status: 'pending' })
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => setState({ status: 'granted', coords: { lat: coords.latitude, lng: coords.longitude } }),
    (error) => setState({ status: error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable' }),
    { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 15_000 },
  )
}

// Permissão já concedida em visita anterior: usa sem perguntar de novo.
void navigator.permissions
  ?.query({ name: 'geolocation' })
  .then((permission) => {
    if (permission.state === 'granted') requestLocation()
  })
  .catch(() => {})

export function useUserLocation(): LocationState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
  )
}
