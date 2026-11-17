import { CalendarClock, CircleX } from 'lucide-react'
import type { DanceEvent } from '../../domain/event'

const STATUS = {
  cancelled: { label: 'Cancelado', icon: CircleX, classes: 'bg-genre-red text-genre-red-fg' },
  postponed: { label: 'Adiado', icon: CalendarClock, classes: 'bg-genre-yellow text-genre-yellow-fg' },
} as const

/** Aviso de evento cancelado ou adiado (marcado no título do calendário). */
export function EventStatusBadge({ status }: { status: NonNullable<DanceEvent['status']> }) {
  const { label, icon: Icon, classes } = STATUS[status]
  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold ${classes}`}>
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </span>
  )
}
