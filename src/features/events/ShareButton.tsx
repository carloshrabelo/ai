import { CheckIcon, ShareFatIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { lisbonDate } from '../../lib/dates'
import type { DanceEvent } from '../../domain/event'
import { useI18n } from '../../i18n/useI18n'
import { eventUrl } from '../../seo/useDocumentHead'
import { formatDayHeading, formatTimeRange } from './format'
import { track } from '../../analytics/track'

/**
 * Partilhar o evento: no celular abre o menu de compartilhamento do sistema (Web Share API);
 * onde não existe (maioria dos desktops), copia o link e avisa "Link copiado".
 */
export function ShareButton({
  event,
  iconOnly = false,
}: {
  event: DanceEvent
  /** Só o ícone (texto para leitor de tela e tooltip). */ iconOnly?: boolean
}) {
  const { t, locale } = useI18n()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2500)
    return () => clearTimeout(timer)
  }, [copied])

  const share = async () => {
    const url = eventUrl(event.slug)
    const when = `${formatDayHeading(lisbonDate(event.start), locale)}, ${formatTimeRange(event, locale)}`
    const text = [event.title, when, event.venue?.name].filter(Boolean).join(' · ')

    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text, url })
        return
      } catch (error) {
        if ((error as DOMException).name === 'AbortError') return // usuário fechou o menu
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      window.prompt(t.event.copyLink, url) // sem acesso à área de transferência
    }
  }

  return (
    <Button
      {...track('event.share', event.slug)}
      variant="secondary"
      onClick={share}
      aria-live="polite"
      title={iconOnly ? t.event.share : undefined}
      className={iconOnly ? 'w-11 shrink-0 px-0' : ''}
    >
      {copied ? (
        <CheckIcon className="size-5 shrink-0" aria-hidden="true" />
      ) : (
        <ShareFatIcon className="size-5 shrink-0" aria-hidden="true" />
      )}
      <span className={iconOnly ? 'sr-only' : ''}>{copied ? t.event.linkCopied : t.event.share}</span>
    </Button>
  )
}
