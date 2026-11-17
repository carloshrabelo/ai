import { Info, type LucideIcon, Music } from 'lucide-react'
import type { Messages } from '../i18n/messages'

export type NavItem = {
  to: string
  label: (t: Messages) => string
  icon: LucideIcon
}

// "Escolas" (/escolas) está oculta até existir uma fonte de dados. A rota continua existindo.
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: (t) => t.nav.dance, icon: Music },
  { to: '/info', label: (t) => t.nav.info, icon: Info },
]
