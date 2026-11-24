import { CheckIcon, ShareFatIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import type { DanceEvent } from '../../domain/event'
import { useI18n } from '../../i18n/useI18n'
import { eventUrl } from '../../seo/useDocumentHead'
import { shareText } from './shareText'
import { track } from '../../analytics/track'
import { copyText } from '../../lib/clipboard'

/**
 * Partilhar o evento: no celular abre o menu de compartilhamento do sistema (Web Share API);
 * onde não existe (maioria dos desktops), copia o texto e avisa "Copiado". Ver shareText.ts.
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
    const text = shareText(event, url, locale)

    if (navigator.share) {
      try {
        // Só o texto (MESSAGE em shareText.ts): o link já vai nele, e `url` o duplicaria; `title` aparecia antes
        // da mensagem no WhatsApp e no Android.
        await navigator.share({ text })
        return
      } catch (error) {
        if ((error as DOMException).name === 'AbortError') return // usuário fechou o menu
      }
    }
    if (await copyText(text, t.event.copyText)) setCopied(true)
  }

  return (
    <Button
      {...track('event.share', event.slug)}
      variant="secondary"
      onClick={() => void share()}
      aria-live="polite"
      title={iconOnly ? t.event.share : undefined}
      className={iconOnly ? 'w-11 shrink-0 px-0' : ''}
    >
      {copied ? (
        <CheckIcon className="size-5 shrink-0" aria-hidden="true" />
      ) : (
        <ShareFatIcon className="size-5 shrink-0" aria-hidden="true" />
      )}
      <span className={iconOnly ? 'sr-only' : ''}>{copied ? t.event.copied : t.event.share}</span>
    </Button>
  )
}
