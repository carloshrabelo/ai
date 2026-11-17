import { NavLink, useLocation } from 'react-router'
import { APP_NAME } from '../app'
import { GENRES } from '../domain/genres'
import { useGenreFilter } from '../features/genres/useGenreFilter'
import { NAV_ITEMS } from './navItems'

const FOCUS = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand'

/**
 * Coluna lateral a partir de `xl` (1280px): nome do app, conteúdo da página (slot) e navegação.
 * A partir de `2xl`, "Dança" ganha a lista de gêneros.
 */
export default function Sidebar({ slotRef }: { slotRef: (element: HTMLElement | null) => void }) {
  const { pathname } = useLocation()
  const { selected, toggle } = useGenreFilter()

  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-surface-muted px-4 pb-6 xl:flex">
      <p className="flex h-14 shrink-0 items-center px-2 text-2xl font-semibold">{APP_NAME}</p>

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

              {to === '/' && pathname === '/' && (
                <ul className="mt-1 hidden space-y-1 pl-11 2xl:block">
                  {/* Mesmo filtro acumulativo do painel "Filtros". */}
                  {GENRES.map((genre) => {
                    const active = selected.includes(genre)
                    return (
                      <li key={genre}>
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggle(genre)}
                          className={`flex h-9 w-full cursor-pointer items-center rounded-lg px-3 text-left text-sm ${FOCUS} ${
                            active ? 'bg-surface font-medium text-brand' : 'text-fg-muted hover:text-fg'
                          }`}
                        >
                          {genre}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
