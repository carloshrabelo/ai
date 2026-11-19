import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useI18n } from '../i18n/useI18n'

/** Intervalo entre verificações de versão nova enquanto o app está aberto. */
const UPDATE_CHECK_MS = 60 * 60_000

/**
 * Registra o service worker em modo autoUpdate: quando há versão nova publicada, ela é
 * instalada e a página recarrega sozinha. Procura versão nova ao abrir, a cada hora e
 * sempre que o app volta para o primeiro plano. Avisa (por alguns segundos) quando o app
 * fica pronto para uso offline.
 */
export default function ReloadPrompt() {
  const { t } = useI18n()
  const {
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => {
        if (navigator.onLine) void registration.update()
      }
      setInterval(check, UPDATE_CHECK_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })

  useEffect(() => {
    if (!offlineReady) return
    const timer = setTimeout(() => setOfflineReady(false), 4000)
    return () => clearTimeout(timer)
  }, [offlineReady, setOfflineReady])

  if (!offlineReady) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-3 rounded-2xl border-2 border-b-4 border-border bg-surface p-4 text-sm font-semibold text-fg shadow-lg xl:inset-x-auto xl:right-6 xl:bottom-6 xl:max-w-sm"
    >
      <span className="flex-1">{t.pwa.offlineReady}</span>
      <button
        className="min-h-11 cursor-pointer rounded-xl px-3 font-bold text-accent hover:bg-surface-muted"
        onClick={() => setOfflineReady(false)}
      >
        {t.pwa.close}
      </button>
    </div>
  )
}
