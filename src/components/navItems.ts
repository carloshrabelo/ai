import { Info, type LucideIcon, Music, School } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dança', icon: Music },
  { to: '/escolas', label: 'Escolas', icon: School },
  { to: '/info', label: 'Info', icon: Info },
]
