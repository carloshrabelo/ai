import { generatePath, Navigate, useLocation, useParams } from 'react-router'

/**
 * Rotas antigas, em português (/evento/<slug>/, /mapa, /comunidade, /info, /escolas, /teste): leva
 * para a rota nova em inglês, mantendo a busca (?date=, filtros) e o hash. Links já compartilhados e
 * os eventos salvos na agenda das pessoas (com o link na descrição) continuam funcionando.
 */
export function LegacyRedirect({ to }: { to: string }) {
  const params = useParams()
  const { search, hash } = useLocation()
  return <Navigate to={{ pathname: generatePath(to, params), search, hash }} replace />
}
