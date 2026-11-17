import { addDays, type IsoDate } from '../../data/dates'
import { formatShortDay } from '../events/format'

type Props = {
  today: IsoDate
  activeDay: IsoDate
  onSelect: (day: IsoDate) => void
}

const ITEM =
  'inline-flex h-11 shrink-0 cursor-pointer items-center rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

/** Ontem / Hoje / Amanhã + o dia ativo quando não é nenhum dos três. */
export function DayShortcuts({ today, activeDay, onSelect }: Props) {
  const shortcuts = [
    { day: addDays(today, -1), label: 'Ontem' },
    { day: today, label: 'Hoje' },
    { day: addDays(today, 1), label: 'Amanhã' },
  ]
  const isShortcut = shortcuts.some(({ day }) => day === activeDay)

  return (
    <div role="group" aria-label="Atalhos de dia" className="flex gap-2 overflow-x-auto [scrollbar-width:none] xl:flex-wrap">
      {shortcuts.map(({ day, label }) => (
        <button
          key={label}
          type="button"
          aria-pressed={day === activeDay}
          onClick={() => onSelect(day)}
          className={`${ITEM} ${day === activeDay ? 'bg-brand text-brand-fg' : 'bg-surface text-fg-muted hover:text-fg'}`}
        >
          {label}
        </button>
      ))}
      {!isShortcut && (
        <span aria-current="date" className={`${ITEM} cursor-default bg-brand text-brand-fg tabular-nums`}>
          {formatShortDay(activeDay)}
        </span>
      )}
    </div>
  )
}
