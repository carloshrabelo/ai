import { useMatches } from 'react-router'
import { APP_NAME, type RouteHandle } from '../app'

/** Título da rota atual (handle.title). */
export default function Header() {
  const matches = useMatches()
  const handle = matches.at(-1)?.handle as RouteHandle | undefined
  const title = handle?.title ?? APP_NAME

  return (
    <header className="sticky top-0 z-10 bg-header pt-[env(safe-area-inset-top)] text-header-fg shadow-sm dark:shadow-none">
      <div className="flex h-14 items-center gap-2 px-4 md:px-6 xl:px-8">
        <h1 className="flex-1 truncate text-2xl font-semibold">{title}</h1>
      </div>
    </header>
  )
}
