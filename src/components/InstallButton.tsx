import { DeviceMobileIcon, DownloadSimpleIcon } from '@phosphor-icons/react'
import { isIOS, promptInstall, useInstallPrompt } from '../pwa/installPrompt'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import type { ReactNode } from 'react'
import { useI18n } from '../i18n/useI18n'

/**
 * Card "Instalar o app": botão (Android/desktop) ou instruções (iOS). Onde não dá para instalar,
 * não aparece.
 */
export default function InstallButton() {
  const { t } = useI18n()
  const { prompt: deferred, installed } = useInstallPrompt()

  if (installed) {
    return (
      <InstallCard>
        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{t.info.installed}</p>
      </InstallCard>
    )
  }

  if (deferred) {
    return (
      <InstallCard hint>
        <Button className="w-full sm:w-auto" onClick={() => void promptInstall()}>
          <DownloadSimpleIcon className="size-5" aria-hidden="true" />
          {t.info.installButton}
        </Button>
      </InstallCard>
    )
  }

  if (isIOS()) {
    return (
      <InstallCard hint>
        <p className="text-sm text-fg-muted">
          {t.info.installIos[0]} <strong>{t.info.installIos[1]}</strong> {t.info.installIos[2]} <strong>{t.info.installIos[3]}</strong>.
        </p>
      </InstallCard>
    )
  }

  return null
}

function InstallCard({ hint = false, children }: { hint?: boolean; children: ReactNode }) {
  const { t } = useI18n()
  return (
    <Card className="space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <DeviceMobileIcon className="size-5 text-brand" aria-hidden="true" />
        {t.info.install}
      </h2>
      {hint && <p className="text-sm text-fg-muted">{t.info.installHint}</p>}
      {children}
    </Card>
  )
}
