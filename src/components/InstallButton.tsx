import { promptInstall, useInstallPrompt } from '../pwa/installPrompt'

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

/** Botão "Instalar" (Android/desktop) ou instruções para iOS. */
export default function InstallButton() {
  const { prompt: deferred, installed } = useInstallPrompt()

  if (installed) {
    return <p className="text-sm text-emerald-600">App instalado ✓</p>
  }

  if (deferred) {
    return (
      <button
        className="min-h-11 w-full rounded-lg bg-brand px-4 text-sm font-medium text-brand-fg sm:w-auto"
        onClick={() => void promptInstall()}
      >
        Instalar app
      </button>
    )
  }

  if (isIOS()) {
    return (
      <p className="text-sm text-fg-muted">
        Para instalar: toque em <strong>Compartilhar</strong> e depois em{' '}
        <strong>Adicionar à Tela de Início</strong>.
      </p>
    )
  }

  return null
}
