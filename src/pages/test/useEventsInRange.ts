import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { addDays, type IsoDate, todayIso } from '../../data/dates'
import { loadEvents } from '../../data/loadEvents'

/** Período padrão: 3 meses para trás e 6 para frente. */
const DAYS_BEFORE = 90
const DAYS_AFTER = 180

/** Eventos de um período escolhido na página (a mesma busca é compartilhada entre as páginas). */
export function useEventsInRange() {
  const today = todayIso()
  const [from, setFrom] = useState<IsoDate>(addDays(today, -DAYS_BEFORE))
  const [to, setTo] = useState<IsoDate>(addDays(today, DAYS_AFTER))
  const query = useQuery({
    queryKey: ['test-events', from, to],
    queryFn: ({ signal }) => loadEvents(from, to, signal),
    enabled: from < to,
    staleTime: Infinity,
  })
  return { from, setFrom, to, setTo, query }
}
