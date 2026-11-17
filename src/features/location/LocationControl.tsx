import { LocateFixed, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { requestLocation, useUserLocation } from './userLocation'

/** Liga as distâncias nos cards (e a posição no mapa). Só pede a localização quando clicado. */
export function LocationControl() {
  const location = useUserLocation()

  switch (location.status) {
    case 'granted':
      return (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <LocateFixed className="size-5 shrink-0 text-brand" aria-hidden="true" />
          <span className="flex-1">Distâncias a partir da sua localização.</span>
          <button
            type="button"
            onClick={requestLocation}
            aria-label="Atualizar localização"
            title="Atualizar localização"
            className="-my-2 -mr-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-lg hover:bg-surface-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-brand"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
          </button>
        </div>
      )
    case 'denied':
      return (
        <p role="status" className="text-sm text-fg-muted">
          Sem permissão de localização. Para ver as distâncias, permita a localização nas configurações do navegador.
        </p>
      )
    default:
      return (
        <div className="space-y-1">
          <Button variant="secondary" className="w-full" onClick={requestLocation} disabled={location.status === 'pending'}>
            <LocateFixed className="size-5" aria-hidden="true" />
            {location.status === 'pending' ? 'Localizando…' : 'Mostrar distâncias'}
          </Button>
          {location.status === 'unavailable' && (
            <p role="status" className="text-sm text-fg-muted">
              Não foi possível obter sua localização. Tente de novo.
            </p>
          )}
        </div>
      )
  }
}
