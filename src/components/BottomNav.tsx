import { NavLink } from 'react-router'

const items = [
  { to: '/', label: 'Início', icon: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z' },
  { to: '/about', label: 'Sobre', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2Zm0-8h-2V7h2Z' },
  {
    to: '/settings',
    label: 'Ajustes',
    icon: 'M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.4-2.9a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5ZM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z',
  },
]

/** Barra inferior no mobile; vira barra lateral a partir de `md`. */
export default function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:sticky md:top-0 md:h-dvh md:w-56 md:border-t-0 md:border-r md:pb-0"
    >
      <p className="hidden px-6 py-6 text-lg font-semibold text-brand md:block">Meu WebApp</p>
      <ul className="flex md:flex-col md:gap-1 md:px-3">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium md:min-h-11 md:flex-row md:justify-start md:gap-3 md:rounded-lg md:px-3 md:text-sm ${
                  isActive
                    ? 'text-brand md:bg-indigo-50 dark:md:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`
              }
            >
              <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden="true">
                <path d={item.icon} />
              </svg>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
