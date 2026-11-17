import { createBrowserRouter } from 'react-router'
import AppLayout from './layouts/AppLayout'
import ErrorPage from './pages/ErrorPage'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    ErrorBoundary: ErrorPage,
    children: [
      { index: true, lazy: { Component: async () => (await import('./pages/Home')).default } },
      { path: 'about', lazy: { Component: async () => (await import('./pages/About')).default } },
      { path: 'settings', lazy: { Component: async () => (await import('./pages/Settings')).default } },
      { path: '*', lazy: { Component: async () => (await import('./pages/NotFound')).default } },
    ],
  },
], { basename: import.meta.env.BASE_URL })
