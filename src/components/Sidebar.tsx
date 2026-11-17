import { NavLink } from 'react-router'
import { APP_NAME } from '../app'
import logo from '../assets/logo.png'
import { NAV_ITEMS } from './navItems'

const FOCUS = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand'

/** Coluna lateral a partir de `xl` (1280px): nome do app, conteúdo da página (slot) e navegação. */
export default function Sidebar({ slotRef }: { slotRef: (element: HTMLElement | null) => void }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-surface-muted px-4 pb-6 xl:flex">
      <p className="flex h-14 shrink-0 items-center gap-2 px-2 text-lg font-semibold whitespace-nowrap">
        <img src={logo} alt="" width={48} height={40} className="h-10 w-auto shrink-0" />
        {APP_NAME}
      </p>

      {/* Conteúdo da página atual (ex.: atalhos de dia e filtros na rota Dança). */}
      <div ref={slotRef} className="space-y-4 empty:hidden" />

      <nav aria-label="Navegação principal">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${FOCUS} ${
                    isActive ? 'bg-surface text-brand shadow-sm dark:shadow-none' : 'text-fg-muted hover:text-fg'
                  }`
                }
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
