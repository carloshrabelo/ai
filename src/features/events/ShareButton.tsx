import { Check, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { lisbonDate } from '../../data/dates'
import type { DanceEvent } from '../../domain/event'
import { useI18n } from '../../i18n/useI18n'
import { eventUrl } from '../../seo/useDocumentHead'
import { formatDayHeading, formatTimeRange } from './format'

/**
 * Partilhar o evento: no celular abre o menu de compartilhamento do sistema (Web Share API);
 * onde não existe (maioria dos desktops), copia o link e avisa "Link copiado".
 */
export function ShareButton({ event }: { event: DanceEvent }) {
  const { t, locale } = useI18n()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2500)
    return () => clearTimeout(timer)
  }, [copied])

  const share = async () => {
    const url = eventUrl(event)
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
    <Button variant="secondary" onClick={share} aria-live="polite">
      {copied ? <Check className="size-5" aria-hidden="true" /> : <Share2 className="size-5" aria-hidden="true" />}
      {copied ? t.event.linkCopied : t.event.share}
    </Button>
  )
}
