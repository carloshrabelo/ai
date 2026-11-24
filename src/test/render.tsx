import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { setLocaleMode } from '../i18n/locale'

/** QueryClient de teste: sem novas tentativas e sem refazer buscas sozinho. */
export function testQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } })
}

/**
 * Renderiza com router (para useSearchParams/useNavigate), TanStack Query e idioma pt-BR (os textos dos testes
 * estão em português; no jsdom o navegador é en-US).
 */
export function renderWithProviders(ui: ReactNode, { route = '/', queryClient = testQueryClient() } = {}) {
  setLocaleMode('pt-BR')
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: [route] })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...result, router, queryClient }
}
