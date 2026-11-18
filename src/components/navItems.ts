import { Compass, Disc3, FlaskConical, Info, type LucideIcon } from 'lucide-react'
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
  { to: '/', label: (t) => t.nav.dance, icon: Disc3 },
  { to: '/mapa', label: (t) => t.nav.map, icon: Compass, mobileOnly: true },
  { to: '/info', label: (t) => t.nav.info, icon: Info },
  // Link para a área de teste (/teste) só com VITE_TEST_PAGES=true (local). As páginas existem no site
  // publicado para quem tem o link, mas não se chega lá pelo app. Ferramenta interna: rótulo sem tradução.
  ...(import.meta.env.VITE_TEST_PAGES === 'true' ? [{ to: '/teste', label: () => 'Teste', icon: FlaskConical }] : []),
]
