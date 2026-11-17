import { Info, type LucideIcon, Map as MapIcon, Music } from 'lucide-react'
import type { Messages } from '../i18n/messages'

export type NavItem = {
  to: string
  label: (t: Messages) => string
  icon: LucideIcon
  /** Só na barra inferior (até 1279px): a partir de `xl` o mapa já está na agenda. */
  mobileOnly?: boolean
}

// "Escolas" (/escolas) está oculta até existir uma fonte de dados. A rota continua existindo.
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: (t) => t.nav.dance, icon: Music },
  { to: '/mapa', label: (t) => t.nav.map, icon: MapIcon, mobileOnly: true },
  { to: '/info', label: (t) => t.nav.info, icon: Info },
]
