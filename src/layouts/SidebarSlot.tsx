import { type ReactNode, use } from 'react'
import { createPortal } from 'react-dom'
import { SidebarSlotContext } from './sidebarSlotContext'

/** Renderiza os filhos dentro da Sidebar (só existe a partir de `xl`). */
export function SidebarPortal({ children }: { children: ReactNode }) {
  const slot = use(SidebarSlotContext)
  return slot ? createPortal(children, slot) : null
}
