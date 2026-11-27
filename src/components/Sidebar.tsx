import { Link, NavLink } from 'react-router'
import { APP_FULL_NAME } from '../app'
import { Logo } from './Logo'
import { useNavItems } from './navItems'
import { useI18n } from '../i18n/useI18n'
import { track } from '../analytics/track'

const FOCUS = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand'

/** Coluna lateral a partir de `xl` (1280px): logo, conteúdo da página (slot) e navegação. */
type SlotRef = (element: HTMLElement | null) => void

export default function Sidebar({ slotRef, bottomSlotRef }: { slotRef: SlotRef; bottomSlotRef: SlotRef }) {
  const { t } = useI18n()
  const navItems = useNavItems()
  return (
    <aside
      aria-label={t.nav.sidebar}
      className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-surface-muted px-4 pb-6 xl:flex"
    >
      {/* Só a logo: o nome do app já está no título do header, ao lado. Leva para a agenda. */}
      <div className="flex h-36 shrink-0 items-center px-2">
        <Link
          {...track('nav.link', '/')}
          to="/"
          aria-label={APP_FULL_NAME}
          title={APP_FULL_NAME}
          className={`mx-auto rounded-lg ${FOCUS.replace('-outline-offset-2', 'outline-offset-2')}`}
        >
          <Logo size={128} className="size-32" />
        </Link>
      </div>

      {/* Conteúdo da página atual (ex.: atalhos de dia e filtros na rota Dança). */}
      <div ref={slotRef} className="space-y-4 empty:hidden" />

      <nav aria-label={t.nav.main}>
        <ul className="space-y-1">
          {navItems
            .filter((item) => !item.mobileOnly)
            .map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  {...track('nav.link', to)}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex h-12 items-center gap-3 rounded-2xl border-2 px-3 text-sm font-bold tracking-wide uppercase ${FOCUS} ${
                      isActive
                        ? 'border-brand/50 bg-brand/10 text-brand'
                        : 'border-transparent text-fg-muted hover:bg-surface hover:text-fg'
                    }`
                  }
                >
                  <Icon className="size-6" aria-hidden="true" />
                  {label(t)}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>

      {/* Conteúdo da página no fim da coluna (ex.: distâncias na rota Dança). */}
      <div ref={bottomSlotRef} className="mt-auto space-y-4 empty:hidden" />
    </aside>
  )
}
