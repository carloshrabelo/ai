import { useMatches } from 'react-router'
import { APP_NAME, type RouteHandle } from '../app'
import logo from '../assets/logo.png'
import { useI18n } from '../i18n/useI18n'

/** Título da rota atual (handle.title). */
export default function Header() {
  const matches = useMatches()
  const { t } = useI18n()
  const handle = matches.at(-1)?.handle as RouteHandle | undefined
  const title = handle?.title?.(t) ?? APP_NAME

  return (
    <header className="sticky top-0 z-10 border-b-2 border-border bg-header pt-[env(safe-area-inset-top)] text-header-fg">
      <div className="flex h-14 items-center gap-2 px-4 md:px-6 xl:px-8">
        {/* A partir de `xl` a logo fica na sidebar. Decorativa: o nome vem logo ao lado. */}
        <img src={logo} alt="" width={48} height={40} className="h-10 w-auto shrink-0 xl:hidden" />
        <h1 className="flex-1 truncate text-2xl font-bold">{title}</h1>
      </div>
    </header>
  )
}
