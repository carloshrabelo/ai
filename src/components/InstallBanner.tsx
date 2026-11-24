import { DeviceMobileIcon, DownloadSimpleIcon, ExportIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { useI18n } from '../i18n/useI18n'
import { dismissInstallBanner, promptInstall, useInstallBanner } from '../pwa/installPrompt'
import { Button } from './ui/Button'
import { track } from '../analytics/track'

/** Espera antes de mostrar: não cobre a tela logo ao abrir (nem o aviso "pronto para offline"). */
const SHOW_AFTER_MS = 8000

/**
 * Aviso de que o app pode ser instalado. Com o convite do navegador (Chrome, Edge, Samsung Internet),
 * o botão abre a instalação nativa; no iPhone/iPad (sem convite), mostra o caminho pelo Compartilhar.
 * Não aparece se o app já está instalado, se o navegador não permite instalar (ex.: Firefox desktop),
 * em Sobre (que já tem o card de instalação) nem durante 30 dias depois de dispensado.
 */
export default function InstallBanner() {
  const { t } = useI18n()
  const mode = useInstallBanner()
  const { pathname } = useLocation()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), SHOW_AFTER_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!ready || !mode || pathname.startsWith('/about')) return null

  return (
    <div
      role="dialog"
      aria-labelledby="install-banner-title"
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex flex-col gap-3 rounded-2xl border-2 border-b-4 border-border bg-surface p-4 text-sm text-fg shadow-lg xl:inset-x-auto xl:right-6 xl:bottom-6 xl:max-w-sm"
    >
      <div className="flex items-start gap-3">
        <DeviceMobileIcon className="size-6 shrink-0 text-brand" aria-hidden="true" />
        <div className="min-w-0 space-y-1">
          <p id="install-banner-title" className="font-bold">
            {t.info.install}
          </p>
          {mode === 'prompt' ? (
            <p className="text-fg-muted">{t.info.installHint}</p>
          ) : (
            <p className="text-fg-muted">
              {t.info.installIos[0]} <ExportIcon className="inline size-4 align-text-bottom" aria-hidden="true" />{' '}
              <strong>{t.info.installIos[1]}</strong> {t.info.installIos[2]} <strong>{t.info.installIos[3]}</strong>.
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button {...track('pwa.install-dismiss')} variant="ghost" onClick={dismissInstallBanner}>
          {t.pwa.notNow}
        </Button>
        {mode === 'prompt' && (
          <Button {...track('pwa.install')} onClick={() => void promptInstall()}>
            <DownloadSimpleIcon className="size-5" aria-hidden="true" />
            {t.info.installButton}
          </Button>
        )}
        {mode === 'ios' && (
          <Button {...track('pwa.install-dismiss')} onClick={dismissInstallBanner}>
            {t.pwa.gotIt}
          </Button>
        )}
      </div>
    </div>
  )
}
