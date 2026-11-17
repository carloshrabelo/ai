import { createBrowserRouter } from 'react-router'
import { APP_NAME, type RouteHandle } from './app'
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
          index: true,
          loader: eventsLoader,
          handle: { title: APP_NAME } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/Dance')).default },
        },
        {
          path: 'escolas',
          handle: { title: 'Escolas' } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/Schools')).default },
        },
        {
          path: 'info',
          handle: { title: 'Info' } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/Info')).default },
        },
        {
          path: '*',
          handle: { title: 'Página não encontrada' } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/NotFound')).default },
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)
