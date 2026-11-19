import { DiscoBallIcon, InfoIcon } from '@phosphor-icons/react'
import { Compass, FlaskConical, UsersRound } from 'lucide-react'
import { type ComponentType, createElement } from 'react'
import type { Messages } from '../i18n/messages'

/** Ícone do menu: Lucide ou Phosphor (os dois aceitam className e aria-hidden). */
type NavIcon = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>

/**
 * Phosphor em peso "bold": o traço (~2,2px a 24px) fica perto do da Lucide (2px); o "regular"
 * (~1,5px) parece mais fino ao lado de Explorar e Comunidade.
 */
const bold =
  (Icon: typeof DiscoBallIcon): NavIcon =>
  (props) =>
    createElement(Icon, { weight: 'bold', ...props })
const DiscoBall = bold(DiscoBallIcon)
const InfoBold = bold(InfoIcon)

export type NavItem = {
  to: string
  label: (t: Messages) => string
  icon: NavIcon
  /** Só na barra inferior (até 1279px): a partir de `xl` o mapa já está na agenda. */
  mobileOnly?: boolean
}

// Ícones escolhidos em /teste/icones: Dança e Sobre do Phosphor (o globo de discoteca não existe na
// Lucide), Explorar e Comunidade da Lucide.
// "Escolas" (/escolas) está oculta até existir uma fonte de dados. A rota continua existindo.
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: (t) => t.nav.dance, icon: DiscoBall },
  { to: '/mapa', label: (t) => t.nav.map, icon: Compass, mobileOnly: true },
  { to: '/comunidade', label: (t) => t.nav.community, icon: UsersRound },
  { to: '/info', label: (t) => t.nav.info, icon: InfoBold },
  // Link para a área de teste (/teste) só com VITE_TEST_PAGES=true (local). As páginas existem no site
  // publicado para quem tem o link, mas não se chega lá pelo app. Ferramenta interna: rótulo sem tradução.
  ...(import.meta.env.VITE_TEST_PAGES === 'true' ? [{ to: '/teste', label: () => 'Teste', icon: FlaskConical }] : []),
]
