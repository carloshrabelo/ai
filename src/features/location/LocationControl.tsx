import { RefreshCw } from 'lucide-react'
import { GpsFixIcon } from '@phosphor-icons/react'
import { Button } from '../../components/ui/Button'
import { requestLocation, useUserLocation } from './userLocation'
import { useI18n } from '../../i18n/useI18n'

/** Liga as distâncias nos cards (e a posição no mapa). Só pede a localização quando clicado. */
export function LocationControl() {
  const location = useUserLocation()
  const { t } = useI18n()

  switch (location.status) {
    case 'granted':
      return (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <GpsFixIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
          <span className="flex-1">{t.location.active}</span>
          <button
            type="button"
            onClick={requestLocation}
            aria-label={t.location.refresh}
            title={t.location.refresh}
            className="-my-2 -mr-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-lg hover:bg-surface-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-brand"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
          </button>
        </div>
      )
    case 'denied':
      return (
        <p role="status" className="text-sm text-fg-muted">
          {t.location.denied}
        </p>
      )
    default:
      return (
        <div className="space-y-1">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              requestLocation()
            }}
            disabled={location.status === 'pending'}
          >
            <GpsFixIcon className="size-5" aria-hidden="true" />
            {location.status === 'pending' ? t.location.locating : t.location.show}
          </Button>
          {location.status === 'unavailable' && (
            <p role="status" className="text-sm text-fg-muted">
              {t.location.unavailable}
            </p>
          )}
        </div>
      )
  }
}
