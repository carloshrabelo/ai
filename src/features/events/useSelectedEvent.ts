import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toSearchString } from '../../domain/genreFilter'

/** Parâmetro antigo (?event=<id do Google>), ainda aceito em links compartilhados antes. */
export const LEGACY_EVENT_PARAM = 'event'

/** /evento/<slug>/ → slug */
export function slugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/evento\/([^/]+)\/?$/)
  return match ? decodeURIComponent(match[1]) : null
}

/** Caminho do evento dentro do app (sem o basename). Com barra final, como no GitHub Pages. */
export const eventPath = (slug: string) => `/evento/${encodeURIComponent(slug)}/`

type OpenedState = { openedFromList?: boolean } | null

/**
 * Evento aberto nos detalhes, guardado no caminho da URL (/evento/<slug>/): link compartilhável,
 * página estática gerada no build (SEO) e o "voltar" do navegador fecha o drawer.
 * Filtros e data (?genres=, ?date=) continuam na query.
 */
export function useSelectedEvent() {
  const location = useLocation()
  const navigate = useNavigate()
  const selectedSlug = slugFromPath(location.pathname)

  const searchWithoutLegacy = useCallback(() => {
    const params = new URLSearchParams(location.search)
    params.delete(LEGACY_EVENT_PARAM)
    return toSearchString(params)
  }, [location.search])

  const open = useCallback(
    (slug: string) => {
      const alreadyOpen = selectedSlug !== null
      // Trocar de um evento para outro não empilha histórico.
      navigate(
        { pathname: eventPath(slug), search: searchWithoutLegacy() },
        {
          replace: alreadyOpen,
          preventScrollReset: true,
          state: { openedFromList: alreadyOpen ? (location.state as OpenedState)?.openedFromList : true },
        },
      )
    },
    [navigate, searchWithoutLegacy, selectedSlug, location.state],
  )

  const close = useCallback(() => {
    if ((location.state as OpenedState)?.openedFromList) navigate(-1)
    else navigate({ pathname: '/', search: searchWithoutLegacy() }, { replace: true, preventScrollReset: true })
  }, [navigate, searchWithoutLegacy, location.state])

  return { selectedSlug, open, close }
}
