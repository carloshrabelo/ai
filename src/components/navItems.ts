import { ChatsTeardropIcon, CompassIcon, FlaskIcon, SmileyIcon, SneakerMoveIcon, type Icon } from '@phosphor-icons/react'
import { useLocation } from 'react-router'
import type { Messages } from '../i18n/messages'

export type NavItem = {
  to: string
  label: (t: Messages) => string
  icon: Icon
  /** Só no celular (até 767px): a partir de `md` (tablet) o mapa já está na agenda. */
  mobileOnly?: boolean
}

// Ícones escolhidos em /lab/icons: Phosphor, peso Duotone (definido no IconContext, em main.tsx).
// "Escolas" (/schools) está oculta até existir uma fonte de dados. A rota continua existindo.
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: (t) => t.nav.agenda, icon: SneakerMoveIcon },
  { to: '/map', label: (t) => t.nav.map, icon: CompassIcon, mobileOnly: true },
  { to: '/community', label: (t) => t.nav.community, icon: ChatsTeardropIcon },
  { to: '/about', label: (t) => t.nav.info, icon: SmileyIcon },
]

/** Laboratório (/lab): ferramentas internas. Rótulo sem tradução. */
const LAB_ITEM: NavItem = { to: '/lab', label: () => 'Lab', icon: FlaskIcon }

/**
 * Itens do menu. O "Lab" só aparece com VITE_TEST_PAGES=true (local) ou para quem já está numa página
 * do laboratório (/lab/*): as páginas são públicas para quem tem o link, mas não se chega lá pelo app.
 */
export function useNavItems(): NavItem[] {
  const { pathname } = useLocation()
  const inLab = pathname === '/lab' || pathname.startsWith('/lab/')
  return import.meta.env.VITE_TEST_PAGES === 'true' || inLab ? [...NAV_ITEMS, LAB_ITEM] : NAV_ITEMS
}
