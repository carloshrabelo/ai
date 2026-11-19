import { CalendarDotsIcon, CloudSlashIcon, HeartIcon } from '@phosphor-icons/react'
import { type ReactNode, useEffect, useState } from 'react'
import InstallButton from '../components/InstallButton'
import LanguageToggle from '../components/LanguageToggle'
import ThemeToggle from '../components/ThemeToggle'
import { Card } from '../components/ui/Card'
import { formatDateTime } from '../features/events/format'
import { useI18n } from '../i18n/useI18n'
import { siteUrl, useDocumentHead } from '../seo/useDocumentHead'

/** Rota "/about": o que é, de onde vêm os eventos, preferências e instalar. */
export default function Info() {
  const online = useOnline()
  const { t, locale } = useI18n()
  useDocumentHead({ title: t.seo.infoTitle, description: t.seo.infoDescription, canonical: `${siteUrl()}about/` })

  const sources = [
    {
      label: t.info.mainSource,
      link: <ExternalLink href="https://pasdedeux.pt/">pasdedeux.pt</ExternalLink>,
      by: <ExternalLink href="https://www.instagram.com/ateterca/">@ateterca</ExternalLink>,
    },
    { label: t.info.tangoSource, link: <ExternalLink href="https://www.tangolx.com/">tangolx.com</ExternalLink> },
    {
      label: t.info.traditionalSource,
      link: (
        <ExternalLink href="https://calendar.google.com/calendar/embed?src=europeias.agenda%40gmail.com&ctz=Europe%2FLisbon">
          europeias.agenda
        </ExternalLink>
      ),
      by: 'Luís Manuel Guerra',
    },
  ]

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      {/* Offline: só aparece quando importa. */}
      {!online && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-2xl border-2 border-b-4 border-genre-yellow bg-genre-yellow/15 p-4 text-sm font-semibold"
        >
          <CloudSlashIcon className="size-6 shrink-0" aria-hidden="true" />
          {t.info.offline}
        </p>
      )}

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">{t.info.about}</h2>
        <p className="text-[15px]">{t.info.aboutText}</p>
        {/* Agradecimento a quem mantém a lista dos eventos (pasdedeux.pt). */}
        <p className="flex gap-3 rounded-2xl border-2 border-brand/30 bg-brand/5 p-3 text-sm">
          <HeartIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
          <span>
            {t.info.thanks[0]} <ExternalLink href="https://www.instagram.com/ateterca/">@ateterca</ExternalLink> {t.info.thanks[1]}
          </span>
        </p>
        <h3 className="pt-1 text-sm font-bold text-fg-muted">{t.info.sources}</h3>
        <ul className="space-y-2">
          {sources.map(({ label, link, by }) => (
            <li key={label} className="flex gap-3">
              <CalendarDotsIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
              <span className="text-sm">
                <span className="block font-bold">{label}</span>
                {link}
                {by && (
                  <span className="text-fg-muted">
                    {' '}
                    · {t.info.maintainedBy} {by}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Rótulo em cima e botões sempre embaixo, ocupando a largura (não mudam de lugar). */}
      <Card className="space-y-4">
        <div className="space-y-2">
          <span className="block text-sm font-bold">{t.info.theme}</span>
          <ThemeToggle className="w-full" />
        </div>
        <div className="space-y-2">
          <span className="block text-sm font-bold">{t.info.language}</span>
          <LanguageToggle className="w-full" />
        </div>
      </Card>

      <InstallButton />

      <p className="text-center text-xs text-fg-muted tabular-nums">
        {t.info.developedBy} <ExternalLink href="https://carloshrabelo.dev/">carloshrabelo.dev</ExternalLink> · {t.info.version}{' '}
        {__APP_VERSION__} · {formatDateTime(new Date(__APP_BUILD_TIME__), locale)}
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
      className="font-bold text-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
