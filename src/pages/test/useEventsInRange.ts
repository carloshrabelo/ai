import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { addDays, type IsoDate, todayIso } from '../../lib/dates'
import { loadEvents } from '../../api/loadEvents'

/** Eventos de um período escolhido na página, por padrão de hoje até `daysAfter` dias à frente (a
 *  mesma busca é compartilhada entre as páginas). */
export function useEventsInRange(daysAfter = 180) {
  const today = todayIso()
  const [from, setFrom] = useState<IsoDate>(today)
  const [to, setTo] = useState<IsoDate>(addDays(today, daysAfter))
  const query = useQuery({
    queryKey: ['test-events', from, to],
    queryFn: ({ signal }) => loadEvents(from, to, signal),
    enabled: from < to,
    staleTime: Infinity,
  })
  return { from, setFrom, to, setTo, query }
}
