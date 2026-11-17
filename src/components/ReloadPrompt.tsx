import { useRegisterSW } from 'virtual:pwa-register/react'

/** Avisa quando o app está pronto para uso offline ou quando há nova versão. */
export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!offlineReady && !needRefresh) return null

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-3 rounded-xl bg-slate-900 p-4 text-sm text-white shadow-lg xl:inset-x-auto xl:right-6 xl:bottom-6 xl:max-w-sm"
    >
      <span className="flex-1">
        {needRefresh ? 'Nova versão disponível.' : 'App pronto para funcionar offline.'}
      </span>
      {needRefresh && (
        <button
          className="min-h-11 rounded-lg bg-brand px-4 font-medium"
          onClick={() => updateServiceWorker(true)}
        >
          Atualizar
        </button>
      )}
      <button className="min-h-11 px-2 text-slate-300" onClick={close}>
        Fechar
      </button>
    </div>
  )
}
