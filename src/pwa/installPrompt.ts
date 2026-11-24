import { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { legacyStorage } from '../lib/persistStorage'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallState = {
  /** Convite de instalação guardado (Chrome/Edge/Samsung, Android e desktop); null quando o navegador não ofereceu. */
  prompt: BeforeInstallPromptEvent | null
  installed: boolean
  /** Quando o aviso de instalação foi dispensado (ms); 0 = nunca. Salvo no aparelho. */
  dismissedAt: number
}

/** Depois de dispensado, o aviso só volta depois deste tempo. */
const DISMISS_FOR_MS = 30 * 24 * 60 * 60_000

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

/** iPhone/iPad no Safari: não há `beforeinstallprompt`; instala-se por Compartilhar → Tela de Início. */
export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/**
 * O navegador dispara `beforeinstallprompt` uma vez, logo ao abrir o app. A página Info carrega
 * depois (rota lazy) e perderia o evento; por isso ele é capturado aqui, assim que o app inicia
 * (importado em main.tsx), e guardado até alguém usar. Só `dismissedAt` é salvo, em texto puro.
 */
const useInstallStore = create<InstallState>()(
  persist((): InstallState => ({ prompt: null, installed: isStandalone(), dismissedAt: 0 }), {
    name: 'install-prompt-dismissed',
    partialize: ({ dismissedAt }) => ({ dismissedAt }),
    storage: legacyStorage<{ dismissedAt: number }>({
      parse: (text) => {
        const value = Number(text)
        return text && Number.isFinite(value) ? { dismissedAt: value } : undefined
      },
      serialize: ({ dismissedAt }) => (dismissedAt ? String(dismissedAt) : null),
    }),
  }),
)

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault() // sem o mini-infobar automático; o app mostra o próprio aviso (InstallBanner) e o botão em Info
  useInstallStore.setState({ prompt: event as BeforeInstallPromptEvent })
})

window.addEventListener('appinstalled', () => useInstallStore.setState({ prompt: null, installed: true }))

// Abriu como app instalado (ex.: o usuário instalou pelo menu do navegador e abriu pela tela inicial).
window.matchMedia('(display-mode: standalone)').addEventListener('change', (media) => {
  if (media.matches) useInstallStore.setState({ prompt: null, installed: true })
})

/** Abre o convite de instalação; o convite só pode ser usado uma vez. */
export async function promptInstall() {
  const { prompt } = useInstallStore.getState()
  if (!prompt) return
  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  useInstallStore.setState((state) => ({
    prompt: null,
    installed: outcome === 'accepted' || state.installed,
    // Recusou no diálogo do navegador: conta como dispensado.
    dismissedAt: outcome === 'dismissed' ? Date.now() : state.dismissedAt,
  }))
}

/** "Agora não" no aviso: some por DISMISS_FOR_MS (o card em Info continua). */
export function dismissInstallBanner() {
  useInstallStore.setState({ dismissedAt: Date.now() })
}

export function useInstallPrompt() {
  const prompt = useInstallStore((state) => state.prompt)
  const installed = useInstallStore((state) => state.installed)
  return { prompt, installed }
}

/**
 * Como oferecer a instalação no aviso: com o convite do navegador ('prompt'), com instruções no
 * iOS ('ios'), ou nada (já instalado, dispensado há pouco, ou navegador sem instalação, como
 * Firefox desktop).
 */
export function useInstallBanner(): 'prompt' | 'ios' | null {
  const prompt = useInstallStore((state) => state.prompt)
  const installed = useInstallStore((state) => state.installed)
  const dismissedAt = useInstallStore((state) => state.dismissedAt)
  const [openedAt] = useState(Date.now)
  if (installed || openedAt - dismissedAt < DISMISS_FOR_MS) return null
  if (prompt) return 'prompt'
  return isIOS() ? 'ios' : null
}
