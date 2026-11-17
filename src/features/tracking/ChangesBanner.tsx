import { useInfiniteQuery } from '@tanstack/react-query'
import { BellRing } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '../../components/ui/Button'
import { type IsoDate, lisbonDate } from '../../data/dates'
import { eventsInfiniteQueryOptions, flattenEvents } from '../../data/queries'
import type { Locale } from '../../i18n/locale'
import type { Messages } from '../../i18n/messages'
import { useI18n } from '../../i18n/useI18n'
import { formatDayHeading } from '../events/format'
import { type EventChange, detectChanges, type EventSnapshot } from './changes'
import { acknowledgeChange, useTrackedSnapshots } from './trackedEvents'

/**
 * Aviso no topo da lista quando um evento que a pessoa adicionou ao calendário mudou
 * (horário, local, cancelamento, adiamento) ou saiu do calendário.
 */
export function ChangesBanner({ startDate, onOpenEvent }: { startDate: IsoDate; onOpenEvent: (id: string) => void }) {
  const { t, locale } = useI18n()
  const saved = useTrackedSnapshots()
  const { data } = useInfiniteQuery(eventsInfiniteQueryOptions(startDate))

  const changes = useMemo(() => {
    const pages = data?.pages ?? []
    if (saved.length === 0 || pages.length === 0) return []
    const ranges = pages.map(({ start, end }) => ({ start, end }))
    return detectChanges(saved, flattenEvents(pages), ranges, (iso) => lisbonDate(new Date(iso)))
  }, [saved, data])

  if (changes.length === 0) return null

  return (
    <section
      role="status"
      aria-labelledby="changes-banner-title"
      className="space-y-3 rounded-xl border border-genre-yellow bg-genre-yellow/15 p-4"
    >
      <h2 id="changes-banner-title" className="flex items-center gap-2 text-sm font-semibold">
        <BellRing className="size-5 shrink-0" aria-hidden="true" />
        {t.tracking.title(changes.length)}
      </h2>
      <ul className="space-y-3">
        {changes.map((change) => (
          <li key={change.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <p className="min-w-0 flex-1">
              <strong>{change.title}</strong> {describe(change, t, locale)}
            </p>
            <div className="flex gap-2">
              {change.kind === 'changed' && (
                <Button variant="secondary" className="h-9" onClick={() => onOpenEvent(change.id)}>
                  {t.tracking.view}
                </Button>
              )}
              <Button variant="ghost" className="h-9" onClick={() => acknowledgeChange(change)}>
                {t.tracking.ok}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function describe(change: EventChange, t: Messages, locale: Locale): string {
  if (change.kind === 'removed' || !change.after) return t.tracking.removed
  const after: EventSnapshot = change.after
  const parts: string[] = []
  if (change.fields.includes('status')) {
    parts.push(
      after.status === 'cancelled' ? t.tracking.cancelled : after.status === 'postponed' ? t.tracking.postponed : t.tracking.rescheduled,
    )
  }
  if (change.fields.includes('time')) {
    const start = new Date(after.start)
    const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'Europe/Lisbon' }).format(start)
    parts.push(t.tracking.newTime(`${formatDayHeading(lisbonDate(start), locale)}, ${time}`))
  }
  if (change.fields.includes('location')) parts.push(t.tracking.newPlace(after.location.split(',')[0]))
  if (change.fields.includes('title')) parts.push(t.tracking.renamed(after.title))
  return parts.join('; ')
}
