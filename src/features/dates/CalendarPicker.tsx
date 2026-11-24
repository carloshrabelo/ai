import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from 'react'
import { IconButton } from '../../components/ui/Button'
import { addDays, type IsoDate } from '../../lib/dates'
import { formatDayHeading, formatDayOfMonth, formatMonthYear, formatWeekdayShort } from '../events/format'
import { useI18n } from '../../i18n/useI18n'
import { track } from '../../analytics/track'

type Props = {
  value: IsoDate
  today: IsoDate
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

/** Deslize mínimo (px) para trocar de mês, e quanto ele precisa ser mais horizontal que vertical. */
const SWIPE_MIN = 40
const SWIPE_RATIO = 1.5

/**
 * Calendário do mês (no lugar do seletor de data do navegador): semanas começando na segunda, hoje
 * com contorno e o dia escolhido em roxo. Setas do teclado andam pelos
 * dias (←/→) e semanas (↑/↓); PageUp/PageDown trocam o mês. No toque, deslizar para os lados troca o
 * mês (o deslize vertical continua rolando a página/folha).
 */
export function CalendarPicker({ value, today, onSelect }: Props) {
  const { t, locale } = useI18n()
  const [focused, setFocused] = useState(value)
  /** Direção da última troca de mês, para a animação de entrada (-1 anterior, 1 próximo). */
  const [direction, setDirection] = useState<-1 | 0 | 1>(0)
  const gridRef = useRef<HTMLDivElement>(null)
  const moved = useRef(false)
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null)
  /** Depois de um deslize, ignora o clique que o navegador dispara no dia onde o dedo saiu. */
  const swiped = useRef(false)
  const month = monthStart(focused)

  // Dia escolhido mudou por fora (atalhos, faixa de dias): o calendário mostra o mês dele.
  const [shownValue, setShownValue] = useState(value)
  if (value !== shownValue) {
    setShownValue(value)
    setFocused(value)
    setDirection(0)
  }

  const goToMonth = (months: -1 | 1) => {
    setDirection(months)
    setFocused(shiftMonth(focused, months))
  }

  const onPointerDown = (event: PointerEvent) => {
    swiped.current = false
    if (event.pointerType === 'mouse') return
    swipe.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
  }
  const onPointerUp = (event: PointerEvent) => {
    const start = swipe.current
    swipe.current = null
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return
    // O clique "fantasma" vem logo depois do pointerup; passado isso, o próximo clique vale.
    swiped.current = true
    setTimeout(() => (swiped.current = false), 0)
    goToMonth(dx < 0 ? 1 : -1) // dedo para a esquerda = próximo mês
  }

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
    if (monthStart(next) !== month) setDirection(next > focused ? 1 : -1)
    setFocused(next)
  }

  return (
    <div className="w-full max-w-sm space-y-2">
      <div className="flex items-center justify-between">
        <IconButton
          {...track('dates.calendar-previous-month')}
          label={t.dates.previousMonth}
          icon={<CaretLeftIcon className="size-5" aria-hidden="true" />}
          onClick={() => goToMonth(-1)}
        />
        <p aria-live="polite" className="font-bold capitalize">
          {formatMonthYear(month, locale)}
        </p>
        <IconButton
          {...track('dates.calendar-next-month')}
          label={t.dates.nextMonth}
          icon={<CaretRightIcon className="size-5" aria-hidden="true" />}
          onClick={() => goToMonth(1)}
        />
      </div>
      {/* touch-action pan-y: o navegador cuida só do deslize vertical; o horizontal troca o mês. A
          key por mês reinicia a animação de entrada a cada troca. */}
      <div
        key={month}
        ref={gridRef}
        role="group"
        aria-label={formatMonthYear(month, locale)}
        className={`grid touch-pan-y grid-cols-7 gap-1 ${direction === 1 ? 'motion-safe:animate-month-next' : direction === -1 ? 'motion-safe:animate-month-previous' : ''}`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
        onClickCapture={(event) => {
          if (!swiped.current) return
          swiped.current = false
          event.stopPropagation()
          event.preventDefault()
        }}
      >
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
              {...track('dates.calendar-day', day)}
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
            </button>
          )
        })}
      </div>
    </div>
  )
}
