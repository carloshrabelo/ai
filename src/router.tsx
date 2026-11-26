import { createBrowserRouter } from 'react-router'
import type { RouteHandle } from './app'
import { eventsLoader } from './api/eventsLoader'
import AppLayout from './layouts/AppLayout'
import ErrorPage from './pages/ErrorPage'
import { LegacyRedirect } from './components/LegacyRedirect'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      Component: AppLayout,
      ErrorBoundary: ErrorPage,
      children: [
        {
          // Agenda e evento aberto (/event/<slug>/) são a mesma página: a rota pai sem caminho
          // mantém a Dance montada ao abrir/fechar detalhes.
          id: 'dance',
          loader: eventsLoader,
          lazy: { Component: async () => (await import('./pages/Dance')).default },
          children: [
            { index: true, handle: { title: (t) => t.nav.agenda } satisfies RouteHandle },
            { path: 'event/:slug', handle: { title: (t) => t.nav.agenda } satisfies RouteHandle },
          ],
        },
        {
          // Celular e tablet: mapa do dia com os eventos num carrossel.
          path: 'map',
          loader: eventsLoader,
          handle: { title: (t) => t.nav.map } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/MapPage')).default },
        },
        {
          path: 'schools',
          handle: { title: (t) => t.nav.schools } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/Schools')).default },
        },
        {
          // Outros calendários, grupos do WhatsApp e Instagram (espelho de pasdedeux.pt/outros.html).
          path: 'community',
          handle: { title: (t) => t.nav.community } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/Community')).default },
        },
        {
          path: 'about',
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
        // Área de teste (/test e ferramentas): pública para quem tem o link, mas sem link no app (o
        // item "Teste" do menu só aparece com VITE_TEST_PAGES=true) e com noindex.
        {
          path: 'test',
          children: [
            {
              index: true,
              handle: { title: () => 'Teste' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/TestIndex')).default },
            },
            {
              path: 'prices',
              handle: { title: () => 'Preços (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/price/Prices')).default },
            },
            {
              path: 'price-formats',
              handle: { title: () => 'Formato de preços (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/price/PriceFormats')).default },
            },
            {
              path: 'no-price',
              handle: { title: () => 'Sem preço (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/price/NoPrice')).default },
            },
            {
              path: 'promoters',
              handle: { title: () => 'Promotores (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/promoters/Promoters')).default },
            },
            {
              path: 'icons',
              handle: { title: () => 'Ícones (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/visual/Icons')).default },
            },
            {
              path: 'genre-colors',
              handle: { title: () => 'Cores dos estilos (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/visual/GenreColors')).default },
            },
            {
              path: 'people',
              handle: { title: () => 'Envolvidos (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/promoters/People')).default },
            },
            {
              path: 'promoter-directory',
              handle: { title: () => 'Diretório de promotores (teste)' } satisfies RouteHandle,
              lazy: { Component: async () => (await import('./pages/test/promoters/PromoterDirectory')).default },
            },
          ],
        },
        // Rotas antigas, em português: redirecionam para as novas (ver LegacyRedirect).
        { path: 'evento/:slug', element: <LegacyRedirect to="/event/:slug/" /> },
        { path: 'mapa', element: <LegacyRedirect to="/map" /> },
        { path: 'comunidade', element: <LegacyRedirect to="/community" /> },
        { path: 'info', element: <LegacyRedirect to="/about" /> },
        { path: 'escolas', element: <LegacyRedirect to="/schools" /> },
        { path: 'teste/*', element: <LegacyRedirect to="/test" /> },
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
