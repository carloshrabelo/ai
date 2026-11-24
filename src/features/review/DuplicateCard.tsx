import { ArrowSquareOutIcon } from '@phosphor-icons/react'
import { Card } from '../../components/ui/Card'
import { CALENDARS } from '../../domain/calendarSources'
import type { DanceEvent } from '../../domain/event'
import { when } from './review'

/** Eventos com o mesmo nome no mesmo dia: horário, calendário e local de cada um, com o link do Google Agenda. */
export function DuplicateCard({ events }: { events: readonly DanceEvent[] }) {
  return (
    <Card className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-surface-muted px-1.5 text-xs text-fg-muted">repetido</span>
        <h3 className="font-semibold">{events[0].title}</h3>
      </div>
      <p className="text-sm text-fg-muted">Mesmo nome no mesmo dia. Confira no Google Agenda e apague o que estiver errado.</p>
      <ul className="space-y-1 text-sm">
        {events.map((event) => (
          <li key={event.id} className="flex flex-wrap items-center gap-x-2">
            <a
              href={event.calendarUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-brand tabular-nums hover:underline"
            >
              {when(event)}
              <ArrowSquareOutIcon className="size-3" aria-hidden="true" />
            </a>
            <span className="text-fg-muted">
              {[CALENDARS[event.source].label, event.rawTag, event.venue?.name].filter(Boolean).join(' · ')}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
