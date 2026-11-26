import { Link, useMatches } from 'react-router'
import { APP_NAME, APP_PARTNER, type RouteHandle } from '../app'
import { Logo } from './Logo'
import { useI18n } from '../i18n/useI18n'
import { track } from '../analytics/track'

/** Nome do app, sempre, seguido do nome da página atual (handle.title), quando a rota tem um. */
export default function Header() {
  const matches = useMatches()
  const { t } = useI18n()
  const handle = matches.at(-1)?.handle as RouteHandle | undefined
  const page = handle?.title?.(t)

  return (
    <header className="sticky top-0 z-10 border-b-2 border-border bg-header pt-[env(safe-area-inset-top)] text-header-fg">
      <div className="flex h-14 items-center gap-2 px-4 md:px-6 xl:px-8">
        {/* Logo e nome do app levam para a agenda. A partir de `xl` a logo fica na sidebar (decorativa
            aqui: o nome vem logo ao lado). O nome não encolhe; se faltar espaço, o nome da página é que
            fica com reticências. */}
        <h1 className="flex min-w-0 flex-1 items-center gap-2 font-bold">
          <Link
            {...track('nav.link', '/')}
            to="/"
            className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Logo className="h-10 w-auto shrink-0 xl:hidden" />
            {/* Nome em cima e "with Pas de Deux" embaixo, menor e mais leve (mesma cor: o contraste
                continua AA). O espaço entre os dois entra no nome lido ("Lisbon Dance with Pas de Deux"). */}
            <span className="flex flex-col items-end text-right">
              <span className="text-xl leading-5 md:text-2xl md:leading-6">{APP_NAME}</span>{' '}
              <span className="text-xs leading-3.5 font-medium md:text-[13px]">{APP_PARTNER}</span>
            </span>
          </Link>
          {page && (
            <>
              {/* Abaixo de `sm` não cabe: o nome da página fica só para leitor de tela (a barra inferior
                  já mostra a página ativa). */}
              <span aria-hidden="true" className="hidden text-lg opacity-60 sm:inline">
                ·
              </span>
              <span className="sr-only sm:not-sr-only sm:truncate sm:text-lg sm:font-semibold sm:opacity-80 md:text-xl">{page}</span>
            </>
          )}
        </h1>
      </div>
    </header>
  )
}
