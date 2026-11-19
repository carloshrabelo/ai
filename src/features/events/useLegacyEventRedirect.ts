import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { IsoDate } from '../../lib/dates'
import { toSearchString } from '../../domain/genreFilter'
import { useEventBySlug } from './useEventBySlug'
import { eventPath, LEGACY_EVENT_PARAM } from './useSelectedEvent'

/**
 * Links compartilhados antes das páginas por evento (?event=<id do Google>): assim que o evento
 * carrega, troca para /evento/<slug>/ (sem novo item no histórico). Sem evento, só limpa o parâmetro.
 */
export function useLegacyEventRedirect(startDate: IsoDate) {
  const location = useLocation()
  const navigate = useNavigate()
  const legacyId = new URLSearchParams(location.search).get(LEGACY_EVENT_PARAM)
  const event = useEventBySlug(startDate, legacyId, 'id')

  useEffect(() => {
    if (!legacyId || event === undefined) return
    const params = new URLSearchParams(location.search)
    params.delete(LEGACY_EVENT_PARAM)
    navigate({ pathname: event ? eventPath(event.slug) : '/', search: toSearchString(params) }, { replace: true })
  }, [legacyId, event, location.search, navigate])
}
