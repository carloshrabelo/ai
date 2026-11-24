import {
  AndroidLogoIcon,
  AppleLogoIcon,
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
  googleSubscribeUrl,
  icsUrl,
  INSTAGRAM,
  OTHER_CALENDARS,
  PASDEDEUX_CALENDARS,
  webcalUrl,
  WHATSAPP_GROUPS,
} from '../content/community'
import { useI18n } from '../i18n/useI18n'
import { buttonClassName } from '../components/ui/buttonStyles'
import { siteUrl, useDocumentHead } from '../seo/useDocumentHead'
import { track } from '../analytics/track'

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
          {...track('community.link', 'https://pasdedeux.pt/outros.html')}
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
            // Nome (com link para ver o calendário no Google Agenda) em cima e as assinaturas embaixo: no
            // celular, os nomes longos não quebram ao lado dos botões. Ordem: Google Agenda (conta Google,
            // que é o que chega ao Android), depois Apple (webcal: Calendário do iPhone e do Mac) e o link
            // .ics para qualquer outro app (Outlook…).
            <li key={id} className="space-y-2 py-3">
              <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-bold">{name}</span>
                <a
                  {...track('community.view-calendar', id)}
                  href={googleCalendarUrl(id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t.community.openGoogle}: ${name}`}
                  className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-brand underline-offset-2 hover:underline sm:min-h-0"
                >
                  {t.community.viewCalendar}
                  <ArrowSquareOutIcon className="size-3.5" aria-hidden="true" />
                </a>
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <a
                  {...track('community.subscribe-google', id)}
                  href={googleSubscribeUrl(id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t.community.subscribeGoogle} (Android): ${name}`}
                  className={buttonClassName('secondary', 'h-9 px-2 text-xs')}
                >
                  <AndroidLogoIcon className="size-4" aria-hidden="true" />
                  {t.community.subscribeGoogle}
                </a>
                <a
                  {...track('community.subscribe-apple', id)}
                  href={webcalUrl(id)}
                  aria-label={`${t.community.subscribeApple}: ${name}`}
                  className={buttonClassName('secondary', 'h-9 px-2 text-xs')}
                >
                  <AppleLogoIcon className="size-4" aria-hidden="true" />
                  {t.community.subscribeApple}
                </a>
                <CopyButton text={icsUrl(id)} label={`${t.community.copyLink}: ${name}`} trackValue={id} />
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
        {links.map(({ name, url, detail }) => (
          <li key={url}>
            <a {...track('community.link', url)} href={url} target="_blank" rel="noopener noreferrer" className={LINK_ROW}>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{name}</span>
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
function CopyButton({ text, label, trackValue }: { text: string; label: string; trackValue: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  return (
    <button
      {...track('community.copy-ics', trackValue)}
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
