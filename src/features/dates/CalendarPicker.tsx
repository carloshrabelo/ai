import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { IconButton } from '../../components/ui/Button'
import { addDays, type IsoDate } from '../../lib/dates'
import { formatDayHeading, formatDayOfMonth, formatMonthYear, formatWeekdayShort } from '../events/format'
import { useI18n } from '../../i18n/useI18n'

type Props = {
  value: IsoDate
  today: IsoDate
  /** Dias que têm eventos (do que já foi carregado, com o filtro aplicado): ganham um ponto. */
  eventDays: ReadonlySet<IsoDate>
  onSelect: (day: IsoDate) => void
}

const monthStart = (day: IsoDate) => `${day.slice(0, 8)}01` as IsoDate
/** 0 = segunda … 6 = domingo. */
const weekdayIndex = (day: IsoDate) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7
function shiftMonth(day: IsoDate, months: number): IsoDate {
  const [year, month] = day.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + months, 1))
  return date.toISOString().slice(0, 10) as IsoDate
}

/**
 * Calendário do mês (no lugar do seletor de data do navegador): semanas começando na segunda, ponto
 * nos dias com eventos, hoje com contorno e o dia escolhido em roxo. Setas do teclado andam pelos
 * dias (←/→) e semanas (↑/↓); PageUp/PageDown trocam o mês.
 */
export function CalendarPicker({ value, today, eventDays, onSelect }: Props) {
  const { t, locale } = useI18n()
  const [focused, setFocused] = useState(value)
  const gridRef = useRef<HTMLDivElement>(null)
  const moved = useRef(false)
  const month = monthStart(focused)

  const first = addDays(month, -weekdayIndex(month))
  const cells = Array.from({ length: 42 }, (_, i) => addDays(first, i))
  const weekdays = cells.slice(0, 7)

  // Só depois de uma tecla: ao abrir, o foco fica no dia escolhido sem roubar o foco do botão.
  useEffect(() => {
    if (!moved.current) return
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focused}"]`)?.focus()
  }, [focused])

  const onKeyDown = (event: KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]
    const next = step
      ? addDays(focused, step)
      : event.key === 'PageUp'
        ? shiftMonth(focused, -1)
        : event.key === 'PageDown'
          ? shiftMonth(focused, 1)
          : undefined
    if (!next) return
    event.preventDefault()
    moved.current = true
    setFocused(next)
  }

  return (
    <div className="w-full max-w-sm space-y-2">
      <div className="flex items-center justify-between">
        <IconButton
          label={t.dates.previousMonth}
          icon={<CaretLeftIcon className="size-5" aria-hidden="true" />}
          onClick={() => setFocused(shiftMonth(focused, -1))}
        />
        <p aria-live="polite" className="font-bold capitalize">
          {formatMonthYear(month, locale)}
        </p>
        <IconButton
          label={t.dates.nextMonth}
          icon={<CaretRightIcon className="size-5" aria-hidden="true" />}
          onClick={() => setFocused(shiftMonth(focused, 1))}
        />
      </div>
      <div ref={gridRef} role="group" aria-label={formatMonthYear(month, locale)} className="grid grid-cols-7 gap-1" onKeyDown={onKeyDown}>
        {weekdays.map((day) => (
          <span key={day} aria-hidden="true" className="py-1 text-center text-xs font-bold text-fg-muted">
            {formatWeekdayShort(day, locale)}
          </span>
        ))}
        {cells.map((day) => {
          const selected = day === value
          const outside = monthStart(day) !== month
          return (
            <button
              key={day}
              type="button"
              data-day={day}
              tabIndex={day === focused ? 0 : -1}
              aria-pressed={selected}
              aria-current={day === today ? 'date' : undefined}
              aria-label={formatDayHeading(day, locale)}
              onClick={() => onSelect(day)}
              className={`relative flex h-11 cursor-pointer items-center justify-center rounded-xl text-sm font-bold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand ${
                selected ? 'bg-brand text-brand-fg' : outside ? 'text-fg-muted/60 hover:bg-surface-muted' : 'text-fg hover:bg-surface-muted'
              } ${day === today && !selected ? 'border-2 border-brand/50' : ''}`}
            >
              {formatDayOfMonth(day, locale)}
              {eventDays.has(day) && (
                <span aria-hidden="true" className={`absolute bottom-1 size-1.5 rounded-full ${selected ? 'bg-brand-fg' : 'bg-brand'}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
