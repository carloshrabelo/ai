import {
  ArrowSquareOutIcon,
  CalendarDotsIcon,
  CalendarPlusIcon,
  CheckIcon,
  CopyIcon,
  type Icon,
  InstagramLogoIcon,
  WhatsappLogoIcon,
} from '@phosphor-icons/react'
import { type ReactNode, useState } from 'react'
import { Card } from '../components/ui/Card'
import {
  type CommunityLink,
  googleCalendarUrl,
  icsUrl,
  INSTAGRAM,
  OTHER_CALENDARS,
  PASDEDEUX_CALENDARS,
  webcalUrl,
  WHATSAPP_GROUPS,
} from '../content/community'
import { useI18n } from '../i18n/useI18n'
import { Chip } from '../components/ui/Chip'
import { buttonClassName } from '../components/ui/buttonStyles'
import { siteUrl, useDocumentHead } from '../seo/useDocumentHead'

const LINK_ROW =
  'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

/**
 * Rota "/community": o que está em https://pasdedeux.pt/outros.html (outros calendários, grupos do
 * WhatsApp, Instagram e os calendários do Pas de Deux para assinar ou abrir no Google Agenda).
 */
export default function Community() {
  const { t } = useI18n()
  useDocumentHead({ title: t.seo.communityTitle, description: t.seo.communityDescription, canonical: `${siteUrl()}community/` })

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <p className="text-sm text-fg-muted">
        {t.community.intro}{' '}
        <a
          href="https://pasdedeux.pt/outros.html"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand hover:underline"
        >
          pasdedeux.pt
        </a>
        .
      </p>

      <LinkSection title={t.community.otherCalendars} icon={CalendarDotsIcon} links={OTHER_CALENDARS} />
      <LinkSection title={t.community.whatsapp} icon={WhatsappLogoIcon} links={WHATSAPP_GROUPS} columns />
      <LinkSection title={t.community.instagram} icon={InstagramLogoIcon} links={INSTAGRAM} />

      <Card className="space-y-3">
        <SectionTitle icon={CalendarPlusIcon}>{t.community.subscribe}</SectionTitle>
        <p className="text-sm text-fg-muted">{t.community.subscribeHint}</p>
        <ul className="divide-y divide-border">
          {PASDEDEUX_CALENDARS.map(({ name, id }) => (
            // Nome em cima e ações embaixo: no celular, os nomes longos não quebram ao lado dos botões.
            // "Assinar" (webcal) no app de agenda; copiar o link .ics; abrir no Google Agenda.
            <li key={id} className="space-y-2 py-3">
              <p className="text-sm font-bold">{name}</p>
              <div className="flex flex-wrap items-center gap-1">
                <a href={webcalUrl(id)} className={buttonClassName('secondary', 'h-9 px-2 text-xs')}>
                  <CalendarPlusIcon className="size-4" aria-hidden="true" />
                  {t.community.subscribeAction}
                </a>
                <a
                  href={googleCalendarUrl(id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t.community.openGoogle}: ${name}`}
                  className={buttonClassName('ghost', 'h-9 px-2 text-xs')}
                >
                  Google
                </a>
                <CopyButton text={icsUrl(id)} label={`${t.community.copyLink}: ${name}`} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}

function SectionTitle({ icon: Icon, children }: { icon: Icon; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-bold">
      <Icon className="size-6 text-brand" aria-hidden="true" />
      {children}
    </h2>
  )
}

/** Seção com uma lista de links externos; `columns`: 2 colunas a partir de `sm` (nomes curtos). */
function LinkSection({ title, icon, links, columns = false }: { title: string; icon: Icon; links: CommunityLink[]; columns?: boolean }) {
  return (
    <Card className="space-y-2">
      <SectionTitle icon={icon}>{title}</SectionTitle>
      <ul className={`-mx-3 ${columns ? 'grid sm:grid-cols-2' : ''}`}>
        {links.map(({ name, url, detail, genre }) => (
          <li key={url}>
            <a href={url} target="_blank" rel="noopener noreferrer" className={LINK_ROW}>
              <span className="min-w-0 flex-1 space-y-1">
                {/* Com estilo: o nome no chip colorido do estilo, como nas tags dos eventos. */}
                {genre ? <Chip genre={genre} label={name} /> : <span className="block text-sm font-bold">{name}</span>}
                {detail && <span className="block truncate text-xs text-fg-muted">{detail}</span>}
              </span>
              <ArrowSquareOutIcon className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Copia o link .ics (para colar no Google Agenda, Outlook…). */
function CopyButton({ text, label }: { text: string; label: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      aria-label={label}
      title={copied ? t.community.copied : t.community.copyLink}
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className={buttonClassName('ghost', 'h-9 px-2 text-xs')}
    >
      {copied ? <CheckIcon className="size-4 text-brand" aria-hidden="true" /> : <CopyIcon className="size-4" aria-hidden="true" />}
      {copied ? t.community.copied : t.community.copyShort}
    </button>
  )
}
