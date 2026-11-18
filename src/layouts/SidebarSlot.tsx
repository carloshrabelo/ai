import { type ReactNode, use } from 'react'
import { createPortal } from 'react-dom'
import { SidebarSlotContext } from './sidebarSlotContext'

/** Renderiza os filhos dentro da Sidebar (só existe a partir de `xl`): em cima ou no fim da coluna. */
export function SidebarPortal({ children, position = 'top' }: { children: ReactNode; position?: 'top' | 'bottom' }) {
  const slot = use(SidebarSlotContext)[position]
  return slot ? createPortal(children, slot) : null
}
