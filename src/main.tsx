import { IconContext } from '@phosphor-icons/react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { persistOptions, queryClient } from './api/queryClient'
import './index.css'
// Idioma (navegador ou escolha salva) aplicado no <html lang> antes do primeiro render.
import './i18n/locale'
// Captura o convite de instalação do PWA assim que o app abre (ver o arquivo).
import './pwa/installPrompt'
import { router } from './router'

const SHOW_DEVTOOLS = import.meta.env.DEV && new URLSearchParams(window.location.search).has('devtools')

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
    {/* Ícones do Phosphor no peso Duotone em todo o app (escolhido em /test/icons). */}
    <IconContext.Provider value={{ weight: 'duotone' }}>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <RouterProvider router={router} />
        {/* Não renderiza nada no build de produção. */}
        {/* Só com ?devtools na URL: o botão flutuante cobria o header nos prints e testes visuais. */}
        {SHOW_DEVTOOLS && <ReactQueryDevtools buttonPosition="bottom-left" />}
      </PersistQueryClientProvider>
    </IconContext.Provider>
  </StrictMode>,
)
