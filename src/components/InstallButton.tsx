import { promptInstall, useInstallPrompt } from '../pwa/installPrompt'
import { useI18n } from '../i18n/useI18n'

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

/** Botão "Instalar" (Android/desktop) ou instruções para iOS. */
export default function InstallButton() {
  const { t } = useI18n()
  const { prompt: deferred, installed } = useInstallPrompt()

  if (installed) {
    return <p className="text-sm text-emerald-700 dark:text-emerald-400">{t.info.installed}</p>
  }

  if (deferred) {
    return (
      <button
        className="min-h-11 w-full rounded-lg bg-brand px-4 text-sm font-medium text-brand-fg sm:w-auto"
        onClick={() => void promptInstall()}
      >
        {t.info.installButton}
      </button>
    )
  }

  if (isIOS()) {
    return (
      <p className="text-sm text-fg-muted">
        {t.info.installIos[0]} <strong>{t.info.installIos[1]}</strong> {t.info.installIos[2]}{' '}
        <strong>{t.info.installIos[3]}</strong>.
      </p>
    )
  }

  return null
}
