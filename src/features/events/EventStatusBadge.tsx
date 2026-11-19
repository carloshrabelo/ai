import { ClockCountdownIcon, XCircleIcon } from '@phosphor-icons/react'
import type { DanceEvent } from '../../domain/event'
import { useI18n } from '../../i18n/useI18n'

const STATUS = {
  cancelled: { icon: XCircleIcon, classes: 'bg-genre-red text-genre-red-fg' },
  postponed: { icon: ClockCountdownIcon, classes: 'bg-genre-yellow text-genre-yellow-fg' },
} as const

/** Aviso de evento cancelado ou adiado (marcado no título do calendário). */
export function EventStatusBadge({ status }: { status: NonNullable<DanceEvent['status']> }) {
  const { t } = useI18n()
  const { icon: Icon, classes } = STATUS[status]
  const label = t.event[status]
  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold ${classes}`}>
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </span>
  )
}
