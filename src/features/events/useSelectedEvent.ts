import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toSearchString } from '../../domain/genreFilter'

/** Parâmetro do evento aberto nos detalhes: ?event=<id>. */
export const EVENT_PARAM = 'event'

type OpenedState = { openedFromList?: boolean } | null

/**
 * Evento aberto nos detalhes, guardado na URL (link compartilhável e botão "voltar" do navegador
 * fecha o drawer). Abrir cria uma entrada no histórico; fechar volta para ela quando possível.
 */
export function useSelectedEvent() {
  const location = useLocation()
  const navigate = useNavigate()
  const selectedId = new URLSearchParams(location.search).get(EVENT_PARAM)

  const withEvent = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(location.search)
      if (id) params.set(EVENT_PARAM, id)
      else params.delete(EVENT_PARAM)
      return { pathname: location.pathname, search: toSearchString(params) }
    },
    [location.pathname, location.search],
  )

  const open = useCallback(
    (id: string) => {
      const alreadyOpen = selectedId !== null
      // Trocar de um evento para outro não empilha histórico.
      navigate(withEvent(id), {
        replace: alreadyOpen,
        preventScrollReset: true,
        state: { openedFromList: alreadyOpen ? (location.state as OpenedState)?.openedFromList : true },
      })
    },
    [navigate, withEvent, selectedId, location.state],
  )

  const close = useCallback(() => {
    if ((location.state as OpenedState)?.openedFromList) navigate(-1)
    else navigate(withEvent(null), { replace: true, preventScrollReset: true })
  }, [navigate, withEvent, location.state])

  return { selectedId, open, close }
}
