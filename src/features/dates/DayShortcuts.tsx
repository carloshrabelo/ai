import { addDays, type IsoDate } from '../../lib/dates'
import { formatShortDay } from '../events/format'
import { useI18n } from '../../i18n/useI18n'
import { TOOL, TOOL_ACTIVE, TOOL_IDLE } from '../../components/ui/buttonStyles'

type Props = {
  today: IsoDate
  activeDay: IsoDate
  onSelect: (day: IsoDate) => void
}

// Mesmo estilo dos botões de ferramenta (calendário e filtro): borda de 2px e base de 4px que afunda.
const ITEM = `inline-flex h-11 shrink-0 cursor-pointer items-center justify-center px-3 xl:px-1 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${TOOL}`

/**
 * Ontem / Hoje / Amanhã + o dia ativo quando não é nenhum dos três. Na sidebar (`xl`), os três numa
 * linha, com a mesma largura.
 */
export function DayShortcuts({ today, activeDay, onSelect }: Props) {
  const { t, locale } = useI18n()
  const shortcuts = [
    { day: addDays(today, -1), label: t.dates.yesterday },
    { day: today, label: t.dates.today },
    { day: addDays(today, 1), label: t.dates.tomorrow },
  ]
  const isShortcut = shortcuts.some(({ day }) => day === activeDay)

  return (
    <div
      role="group"
      aria-label={t.dates.shortcuts}
      className="flex gap-2 overflow-x-auto [scrollbar-width:none] xl:grid xl:grid-cols-3 xl:overflow-visible"
    >
      {shortcuts.map(({ day, label }) => (
        <button
          key={label}
          type="button"
          aria-pressed={day === activeDay}
          onClick={() => {
            onSelect(day)
          }}
          className={`${ITEM} ${day === activeDay ? TOOL_ACTIVE : TOOL_IDLE}`}
        >
          {label}
        </button>
      ))}
      {!isShortcut && (
        <span aria-current="date" className={`${ITEM} cursor-default tabular-nums xl:col-span-3 ${TOOL_ACTIVE}`}>
          {formatShortDay(activeDay, locale)}
        </span>
      )}
    </div>
  )
}
