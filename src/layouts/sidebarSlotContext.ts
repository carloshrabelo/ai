import { createContext } from 'react'

/** Elemento da Sidebar onde a página atual pode renderizar conteúdo (ex.: filtros). */
export const SidebarSlotContext = createContext<HTMLElement | null>(null)
