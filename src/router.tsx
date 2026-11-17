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
          index: true,
          loader: eventsLoader,
          lazy: { Component: async () => (await import('./pages/Dance')).default },
        },
        {
          path: 'escolas',
          handle: { title: (t) => t.nav.schools } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/Schools')).default },
        },
        {
          path: 'info',
          handle: { title: (t) => t.nav.info } satisfies RouteHandle,
          lazy: { Component: async () => (await import('./pages/Info')).default },
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
