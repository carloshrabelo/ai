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
        {NAV_ITEMS.map(({ to, label, icon: Icon, mobileOnly }) => (
          <li key={to} className={`flex-1 ${mobileOnly ? 'md:hidden' : ''}`}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex h-full flex-col items-center justify-center gap-0.5 text-xs font-bold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand ${
                  isActive ? 'text-brand' : 'text-fg-muted hover:text-fg'
                }`
              }
            >
              {/* Ativo: pílula roxa clara com borda atrás do ícone (estilo Duolingo). */}
              <span className="flex h-8 w-12 items-center justify-center rounded-xl border-2 border-transparent group-aria-[current=page]:border-brand/40 group-aria-[current=page]:bg-brand/10">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              {label(t)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
