import { useSyncExternalStore } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallState = {
  /** Convite de instalação guardado (Android/desktop); null quando o navegador não ofereceu. */
  prompt: BeforeInstallPromptEvent | null
  installed: boolean
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

/**
 * O navegador dispara `beforeinstallprompt` uma vez, logo ao abrir o app. A página Info carrega
 * depois (rota lazy) e perderia o evento; por isso ele é capturado aqui, assim que o app inicia
 * (importado em main.tsx), e guardado até alguém usar.
 */
let state: InstallState = { prompt: null, installed: isStandalone() }
const listeners = new Set<() => void>()

function setState(next: InstallState) {
  state = next
  for (const listener of listeners) listener()
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault() // sem o banner automático; o botão em Info usa o convite guardado
  setState({ ...state, prompt: event as BeforeInstallPromptEvent })
})

window.addEventListener('appinstalled', () => setState({ prompt: null, installed: true }))

/** Abre o convite de instalação; o convite só pode ser usado uma vez. */
export async function promptInstall() {
  const { prompt } = state
  if (!prompt) return
  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  setState({ prompt: null, installed: outcome === 'accepted' || state.installed })
}

export function useInstallPrompt(): InstallState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
  )
}
