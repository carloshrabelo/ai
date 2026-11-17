import { NavLink } from 'react-router'
import { NAV_ITEMS } from './navItems'
import { useI18n } from '../i18n/useI18n'

/** Barra inferior até 1279px. A partir de `xl`, a navegação fica na Sidebar. */
export default function BottomNav() {
  const { t } = useI18n()
  return (
    <nav
      aria-label={t.nav.main}
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-3xl">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex h-full flex-col items-center justify-center gap-1 text-xs font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand ${
                  isActive ? 'text-brand' : 'text-fg-muted hover:text-fg'
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
  )
}
