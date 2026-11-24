import { create } from 'zustand'
import type { Coords } from './distance'

export type LocationState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'granted'; coords: Coords }
  | { status: 'denied' }
  | { status: 'unavailable' }

/**
 * Localização do usuário, compartilhada pelo app (cards, mapa, filtros). Não é salva: a permissão
 * do navegador é que fica.
 * Só pede permissão quando o usuário pede; se a permissão já foi dada antes, carrega sozinha.
 */
const useLocationStore = create<{ location: LocationState }>()(() => ({ location: { status: 'idle' } }))

const setLocation = (location: LocationState) => useLocationStore.setState({ location })

export function requestLocation() {
  if (!('geolocation' in navigator)) {
    setLocation({ status: 'unavailable' })
    return
  }
  if (useLocationStore.getState().location.status !== 'granted') setLocation({ status: 'pending' })
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => setLocation({ status: 'granted', coords: { lat: coords.latitude, lng: coords.longitude } }),
    (error) => setLocation({ status: error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable' }),
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
  return useLocationStore((state) => state.location)
}
