import { createBrowserRouter } from 'react-router'
import type { RouteHandle } from './app'
import { eventsLoader } from './data/eventsLoader'
import AppLayout from './layouts/AppLayout'
import ErrorPage from './pages/ErrorPage'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      Component: AppLayout,
      ErrorBoundary: ErrorPage,
      children: [
        {
          // Agenda e evento aberto (/evento/<slug>/) são a mesma página: a rota pai sem caminho
          // mantém a Dance montada ao abrir/fechar detalhes.
          id: 'dance',
          loader: eventsLoader,
          lazy: { Component: async () => (await import('./pages/Dance')).default },
          children: [{ index: true }, { path: 'evento/:slug' }],
        },
        {
          // Celular e tablet: mapa do dia com os eventos num carrossel.
          path: 'mapa',
          loader: eventsLoader,
          handle: { title: (t) => t.nav.map } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/MapPage')).default },
        },
        {
          path: 'escolas',
          handle: { title: (t) => t.nav.schools } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/Schools')).default },
        },
        {
          // Outros calendários, grupos do WhatsApp e Instagram (espelho de pasdedeux.pt/outros.html).
          path: 'comunidade',
          handle: { title: (t) => t.nav.community } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/Community')).default },
        },
        {
          path: 'info',
          handle: { title: (t) => t.nav.info } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/Info')).default },
        },
        {
          // Revisão do texto dos eventos (ortografia e perfis escritos errado): pública, mas sem link
          // no app nem no sitemap, e com noindex.
          path: 'review',
          handle: { title: () => 'Revisão' } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/Review')).default },
        },
        // Área de teste (/teste e ferramentas): pública para quem tem o link, mas sem link no app (o
        // item "Teste" do menu só aparece com VITE_TEST_PAGES=true) e com noindex.
        {
          path: 'teste',
          children: [
            {
              index: true,
              handle: { title: () => 'Teste' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/TestIndex')).default },
            },
            {
              path: 'precos',
              handle: { title: () => 'Preços (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/Prices')).default },
            },
            {
              path: 'sem-preco',
              handle: { title: () => 'Sem preço (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/NoPrice')).default },
            },
            {
              path: 'promotores',
              handle: { title: () => 'Promotores (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/Promoters')).default },
            },
            {
              path: 'icones',
              handle: { title: () => 'Ícones (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/Icons')).default },
            },
            {
              path: 'envolvidos',
              handle: { title: () => 'Envolvidos (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/People')).default },
            },
            {
              path: 'diretorio-promotores',
              handle: { title: () => 'Diretório de promotores (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/PromoterDirectory')).default },
            },
          ],
        },
        {
          path: '*',
          handle: { title: (t) => t.routes.notFound } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/NotFound')).default },
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)
