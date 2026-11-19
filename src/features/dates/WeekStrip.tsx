import { useInfiniteQuery } from '@tanstack/react-query'
import { CalendarDotsIcon } from '@phosphor-icons/react'
import { type ReactNode, useEffect, useRef } from 'react'
import { IconButton } from '../../components/ui/Button'
import { WINDOW_DAYS } from '../../api/config'
import { addDays, type IsoDate, isIsoDate } from '../../lib/dates'
import { eventsInfiniteQueryOptions } from '../../api/queries'
import { formatDayHeading, formatDayOfMonth, formatWeekdayShort } from '../events/format'
import { useI18n } from '../../i18n/useI18n'

type Props = {
  startDate: IsoDate
  activeDay: IsoDate
  onSelect: (day: IsoDate) => void
  /** Ações depois da faixa (ex.: botão de filtros). */
  actions?: ReactNode
}

/** Botão de calendário + faixa de dias, do início do feed até o fim do que já foi carregado. */
export function WeekStrip({ startDate, activeDay, onSelect, actions }: Props) {
  const { t, locale } = useI18n()
  // Só lê o cache (mesma query do feed): a faixa cresce conforme novas janelas chegam.
  const { data } = useInfiniteQuery(eventsInfiniteQueryOptions(startDate))
  const end = data?.pages.at(-1)?.end ?? addDays(startDate, WINDOW_DAYS)
  const days: IsoDate[] = []
  for (let day = startDate; day < end; day = addDays(day, 1)) days.push(day)

  const stripRef = useRef<HTMLUListElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Mantém o dia ativo visível na faixa, sem rolar a página.
  useEffect(() => {
    const strip = stripRef.current
    const item = strip?.querySelector<HTMLElement>(`[data-strip-day="${activeDay}"]`)
    if (!strip || !item) return
    strip.scrollTo({ left: item.offsetLeft - strip.clientWidth / 2 + item.clientWidth / 2, behavior: 'smooth' })
  }, [activeDay])

  const openPicker = () => {
    const input = dateInputRef.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <IconButton
        label={t.dates.pickDate}
        variant="tool"
        icon={<CalendarDotsIcon className="size-6" aria-hidden="true" />}
        onClick={openPicker}
        className="size-14"
      />
      <input
        ref={dateInputRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        value={activeDay}
        onChange={(event) => {
          if (isIsoDate(event.target.value)) {
            onSelect(event.target.value)
          }
        }}
      />

      <ul
        ref={stripRef}
        aria-label={t.dates.days}
        className="flex min-w-0 flex-1 snap-x gap-1 overflow-x-auto rounded-lg bg-surface p-1 [scrollbar-width:none]"
      >
        {days.map((day) => {
          const active = day === activeDay
          return (
            <li key={day} data-strip-day={day} className="snap-start">
              <button
                type="button"
                aria-pressed={active}
                aria-label={formatDayHeading(day, locale)}
                onClick={() => {
                  onSelect(day)
                }}
                className={`flex h-12 w-11 cursor-pointer flex-col items-center justify-center rounded-md tabular-nums transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand ${
                  active ? 'bg-brand text-brand-fg' : 'text-fg hover:bg-surface-muted'
                }`}
              >
                <span className="text-sm font-semibold">{formatDayOfMonth(day, locale)}</span>
                <span className={`text-xs ${active ? '' : 'text-fg-muted'}`}>{formatWeekdayShort(day, locale)}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {actions}
    </div>
  )
}
