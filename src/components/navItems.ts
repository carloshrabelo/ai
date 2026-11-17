import { Info, type LucideIcon, Music } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

// "Escolas" (/escolas) está oculta até existir uma fonte de dados. A rota continua existindo.
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dança', icon: Music },
  { to: '/info', label: 'Info', icon: Info },
]
