import { CalendarDotsIcon } from '@phosphor-icons/react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { addDays, type IsoDate } from '../../lib/dates'
import { formatShortDay } from '../events/format'
import { useI18n } from '../../i18n/useI18n'
import { TOOL, TOOL_ACTIVE, TOOL_IDLE } from '../../components/ui/buttonStyles'
import { DatePickerPopup } from './DatePickerPopup'
import { track } from '../../analytics/track'

type Props = {
  today: IsoDate
  activeDay: IsoDate
  onSelect: (day: IsoDate) => void
}

// Mesmo estilo dos botões de ferramenta (calendário e filtro): borda de 2px e base de 4px que afunda.
// flex-1 + shrink-0: ocupam a linha quando cabem; quando não cabem, a linha rola para o lado.
const ITEM = `inline-flex h-11 flex-1 shrink-0 cursor-pointer items-center justify-center gap-1.5 px-3 xl:px-1 text-sm font-bold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${TOOL}`

const FADE = 16

/**
 * Ontem / Hoje / Amanhã / Outra data. "Outra data" abre o calendário e, com um dia fora dos atalhos
 * ativo, mostra esse dia. No celular, a linha rola para o lado quando não cabe (o botão ativo é
 * trazido para a vista); na sidebar (`xl`), os três atalhos numa linha e "Outra data" embaixo.
 */
export function DayShortcuts({ today, activeDay, onSelect }: Props) {
  const { t, locale } = useI18n()
  const shortcuts = [
    { day: addDays(today, -1), label: t.dates.yesterday, id: 'yesterday' },
    { day: today, label: t.dates.today, id: 'today' },
    { day: addDays(today, 1), label: t.dates.tomorrow, id: 'tomorrow' },
  ]
  const isCustom = !shortcuts.some(({ day }) => day === activeDay)
  const [pickerOpen, setPickerOpen] = useState(false)
  const closePicker = useCallback(() => setPickerOpen(false), [setPickerOpen])
  const containerRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })

  const updateEdges = useCallback(() => {
    const row = rowRef.current
    if (!row) return
    const start = row.scrollLeft > 1
    const end = row.scrollLeft + row.clientWidth < row.scrollWidth - 1
    setEdges((current) => (current.start === start && current.end === end ? current : { start, end }))
  }, [])

  // Botão ativo sempre à vista (só a linha rola, não a página).
  useLayoutEffect(() => {
    const row = rowRef.current
    const item = row?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!row || !item) return
    if (item.offsetLeft < row.scrollLeft) row.scrollLeft = item.offsetLeft
    else if (item.offsetLeft + item.offsetWidth > row.scrollLeft + row.clientWidth)
      row.scrollLeft = item.offsetLeft + item.offsetWidth - row.clientWidth
    updateEdges()
  }, [activeDay, isCustom, updateEdges])

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return
    const observer = new ResizeObserver(updateEdges)
    observer.observe(row)
    return () => observer.disconnect()
  }, [updateEdges])

  const mask = `linear-gradient(to right, ${edges.start ? 'transparent' : 'black'}, black ${FADE}px, black calc(100% - ${FADE}px), ${edges.end ? 'transparent' : 'black'})`

  return (
    <div ref={containerRef} className="relative">
      <div
        ref={rowRef}
        role="group"
        aria-label={t.dates.shortcuts}
        onScroll={updateEdges}
        style={{ maskImage: mask, WebkitMaskImage: mask }}
        className="flex gap-1.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] xl:grid xl:grid-cols-3 xl:gap-2 xl:overflow-visible"
      >
        {shortcuts.map(({ day, label, id }) => (
          <button
            key={label}
            {...track('dates.shortcut', id)}
            type="button"
            aria-pressed={day === activeDay}
            onClick={() => onSelect(day)}
            className={`${ITEM} ${day === activeDay ? TOOL_ACTIVE : TOOL_IDLE}`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          {...track('dates.other-date')}
          aria-pressed={isCustom}
          aria-expanded={pickerOpen}
          aria-haspopup="dialog"
          aria-label={isCustom ? `${t.dates.pickDate}: ${formatShortDay(activeDay, locale)}` : t.dates.pickDate}
          onClick={() => setPickerOpen((open) => !open)}
          className={`${ITEM} tabular-nums xl:col-span-3 ${isCustom ? TOOL_ACTIVE : TOOL_IDLE}`}
        >
          <CalendarDotsIcon className="size-5 shrink-0" aria-hidden="true" />
          {isCustom ? formatShortDay(activeDay, locale) : t.dates.otherDate}
        </button>
      </div>
      {pickerOpen && <DatePickerPopup value={activeDay} onSelect={onSelect} onClose={closePicker} containerRef={containerRef} />}
    </div>
  )
}
