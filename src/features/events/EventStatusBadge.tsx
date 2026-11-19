import { BroadcastIcon, CheckCircleIcon, ClockCountdownIcon, XCircleIcon } from '@phosphor-icons/react'
import type { DanceEvent } from '../../domain/event'
import { useI18n } from '../../i18n/useI18n'

const STATUS = {
  live: { icon: BroadcastIcon, classes: 'bg-genre-green text-genre-green-fg' },
  ended: { icon: CheckCircleIcon, classes: 'bg-genre-neutral text-genre-neutral-fg' },
  cancelled: { icon: XCircleIcon, classes: 'bg-genre-red text-genre-red-fg' },
  postponed: { icon: ClockCountdownIcon, classes: 'bg-genre-yellow text-genre-yellow-fg' },
} as const

/**
 * Aviso de evento cancelado ou adiado (marcado no título do calendário), ou do momento: acontecendo
 * agora ou já encerrado.
 */
export function EventStatusBadge({ status }: { status: NonNullable<DanceEvent['status']> | 'live' | 'ended' }) {
  const { t } = useI18n()
  const { icon: Icon, classes } = STATUS[status]
  const label = t.event[status]
  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-xl px-2 text-[13px] font-bold ${classes}`}>
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </span>
  )
}
