import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { persistOptions, queryClient } from './data/queryClient'
import './index.css'
// Captura o convite de instalação do PWA assim que o app abre (ver o arquivo).
import './pwa/installPrompt'
import { router } from './router'

// Em dev sem PWA_DEV: remove service workers e caches que sobraram de sessões antigas,
// que serviriam arquivos velhos no localhost.
if (import.meta.env.DEV && !__PWA_IN_DEV__ && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length === 0) return
    void Promise.all([
      ...registrations.map((registration) => registration.unregister()),
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))),
    ]).then(() => window.location.reload())
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <RouterProvider router={router} />
      {/* Não renderiza nada no build de produção. */}
      <ReactQueryDevtools buttonPosition="top-right" />
    </PersistQueryClientProvider>
  </StrictMode>,
)
