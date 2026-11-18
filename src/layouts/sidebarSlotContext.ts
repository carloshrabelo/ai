import { createContext } from 'react'

/** Elementos da Sidebar onde a página atual pode renderizar conteúdo: em cima (antes da navegação) e
 *  no fim da coluna (depois dela). */
export type SidebarSlots = { top: HTMLElement | null; bottom: HTMLElement | null }

export const SidebarSlotContext = createContext<SidebarSlots>({ top: null, bottom: null })
