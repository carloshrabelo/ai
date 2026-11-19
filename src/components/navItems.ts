import { ChatsTeardropIcon, CompassIcon, FlaskIcon, SmileyIcon, SneakerMoveIcon, type Icon } from '@phosphor-icons/react'
import type { Messages } from '../i18n/messages'

export type NavItem = {
  to: string
  label: (t: Messages) => string
  icon: Icon
  /** Só no celular (até 767px): a partir de `md` (tablet) o mapa já está na agenda. */
  mobileOnly?: boolean
}

// Ícones escolhidos em /test/icons: Phosphor, peso Duotone (definido no IconContext, em main.tsx).
// "Escolas" (/schools) está oculta até existir uma fonte de dados. A rota continua existindo.
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: (t) => t.nav.agenda, icon: SneakerMoveIcon },
  { to: '/map', label: (t) => t.nav.map, icon: CompassIcon, mobileOnly: true },
  { to: '/community', label: (t) => t.nav.community, icon: ChatsTeardropIcon },
  { to: '/about', label: (t) => t.nav.info, icon: SmileyIcon },
  // Link para a área de teste (/test) só com VITE_TEST_PAGES=true (local). As páginas existem no site
  // publicado para quem tem o link, mas não se chega lá pelo app. Ferramenta interna: rótulo sem tradução.
  ...(import.meta.env.VITE_TEST_PAGES === 'true' ? [{ to: '/test', label: () => 'Teste', icon: FlaskIcon }] : []),
]
