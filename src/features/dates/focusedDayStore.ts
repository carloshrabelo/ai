import { create } from 'zustand'
import type { IsoDate } from '../../lib/dates'

type FocusedDayState = {
  /** Último dia em foco na agenda ou no mapa; null antes de qualquer navegação. */
  day: IsoDate | null
  setDay: (day: IsoDate) => void
}

/**
 * Dia em foco, compartilhado entre a agenda (/) e o mapa (/map): ao trocar de página, a faixa de dias
 * continua no mesmo dia em vez de voltar para hoje. Vale só nesta sessão (não é salvo no aparelho):
 * ao abrir o app de novo, começa em hoje.
 */
export const useFocusedDay = create<FocusedDayState>()((set) => ({
  day: null,
  setDay: (day) => set((state) => (state.day === day ? state : { day })),
}))
