import { type ReactNode, useEffect, useState } from 'react'
import InstallButton from '../components/InstallButton'
import LanguageToggle from '../components/LanguageToggle'
import ThemeToggle from '../components/ThemeToggle'
import { Card } from '../components/ui/Card'
import { formatDateTime } from '../features/events/format'
import { useI18n } from '../i18n/useI18n'
import { siteUrl, useDocumentHead } from '../seo/useDocumentHead'

/** Rota "/info". */
export default function Info() {
  const online = useOnline()
  const { t, locale } = useI18n()
  useDocumentHead({ title: t.seo.infoTitle, description: t.seo.infoDescription, canonical: `${siteUrl()}info/` })

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">{t.info.about}</h2>
        <p className="text-sm text-fg-muted">
          {t.info.aboutText} <ExternalLink href="https://pasdedeux.pt/">pasdedeux.pt</ExternalLink>,{' '}
          {t.info.maintainedBy} <ExternalLink href="https://www.instagram.com/ateterca/">@ateterca</ExternalLink>.
        </p>
        <p className="text-sm text-fg-muted">
          {t.info.moreCalendars}{' '}
          <ExternalLink href="https://calendar.google.com/calendar/embed?src=agendatangolx%40gmail.com&ctz=Europe%2FLisbon">
            agendatangolx
          </ExternalLink>{' '}
          {t.info.and}{' '}
          <ExternalLink href="https://calendar.google.com/calendar/embed?src=europeias.agenda%40gmail.com&ctz=Europe%2FLisbon">
            europeias.agenda
          </ExternalLink>
          .
        </p>
        <p className="text-sm text-fg-muted">
          {t.info.developedBy} <ExternalLink href="https://carloshrabelo.dev/">carloshrabelo.dev</ExternalLink>.
        </p>
      </Card>

      {/* Rótulo em cima e botões sempre embaixo, ocupando a largura (não mudam de lugar). */}
      <Card className="space-y-2">
        <span className="block text-sm">{t.info.theme}</span>
        <ThemeToggle className="w-full" />
      </Card>

      <Card className="space-y-2">
        <span className="block text-sm">{t.info.language}</span>
        <LanguageToggle className="w-full" />
      </Card>

      <Card className="flex items-center justify-between">
        <span className="text-sm">{t.info.connection}</span>
        <span className={`text-sm ${online ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
          {online ? t.info.online : t.info.offline}
        </span>
      </Card>

      <Card className="space-y-2">
        <span className="text-sm">{t.info.install}</span>
        <InstallButton />
      </Card>

      <p className="text-center text-xs text-fg-muted tabular-nums">
        {t.info.version} {__APP_VERSION__} · {formatDateTime(new Date(__APP_BUILD_TIME__), locale)}
      </p>
    </section>
  )
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {children}
    </a>
  )
}

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}
