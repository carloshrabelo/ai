import { createContext, use } from 'react'
import type { Agenda } from '../../domain/agenda'

/** Agenda da página (Dança ou Tradicionais): lista, mapa e cabeçalho mostram só os eventos dela. */
export const AgendaContext = createContext<Agenda>('dance')

export const useAgenda = () => use(AgendaContext)
