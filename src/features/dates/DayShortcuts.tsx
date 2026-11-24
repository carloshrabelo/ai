import { CalendarDotsIcon } from '@phosphor-icons/react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { addDays, agendaToday, type IsoDate, todayIso } from '../../lib/dates'
import { useNow } from '../../hooks/useNow'
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
 * Hoje / Amanhã / Outra data, e Ontem só de madrugada. "Outra data" abre o calendário e, com um dia fora dos
 * atalhos ativo, mostra esse dia. No celular, a linha rola para o lado quando não cabe (o botão ativo é trazido
 * para a vista); na sidebar (`xl`), os atalhos numa linha e "Outra data" embaixo.
 *
 * "Ontem" aparece da 00:00 às 05:00 (nesse intervalo o "Hoje" da agenda ainda é a noite anterior, ver
 * agendaToday, e "Ontem" é o dia antes dela) e sempre que o dia em foco é ontem: "Ontem" aparece marcado e
 * "Outra data" mostra a data dele, sem marcar. No resto do tempo fica escondido. O relógio (useNow) atualiza a cada minuto: o botão
 * aparece e some sozinho.
 */
export function DayShortcuts({ today, activeDay, onSelect }: Props) {
  const { t, locale } = useI18n()
  const now = new Date(useNow())
  const yesterday = addDays(today, -1)
  const showYesterday = todayIso(now) !== agendaToday(now) || activeDay === yesterday
  const shortcuts = [
    ...(showYesterday ? [{ day: yesterday, label: t.dates.yesterday, id: 'yesterday' }] : []),
    { day: today, label: t.dates.today, id: 'today' },
    { day: addDays(today, 1), label: t.dates.tomorrow, id: 'tomorrow' },
  ]
  const isCustom = !shortcuts.some(({ day }) => day === activeDay)
  // Com ontem em foco, "Outra data" também mostra a data (sem ficar marcado: quem fica marcado é "Ontem").
  const showDate = isCustom || activeDay === yesterday
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
    // Medido pela própria linha (offsetLeft conta a partir do contêiner `relative` e erraria pelo padding).
    const rowRect = row.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    if (itemRect.left < rowRect.left) row.scrollLeft -= rowRect.left - itemRect.left
    else if (itemRect.right > rowRect.right) row.scrollLeft += itemRect.right - rowRect.right
    updateEdges()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- gatilho: o dia ativo e o "Outra data" são o gatilho para trazer o botão ativo à vista
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
        // -m-1 p-1: 4px de folga dentro da área que rola para o contorno de foco (2px + 2px de distância), que o
        // overflow cortaria; a margem negativa desfaz o padding, e o layout não muda.
        className={`-m-1 flex gap-1.5 overflow-x-auto overscroll-x-contain p-1 [scrollbar-width:none] xl:m-0 xl:grid xl:gap-2 xl:overflow-visible xl:p-0 ${showYesterday ? 'xl:grid-cols-3' : 'xl:grid-cols-2'}`}
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
          // O nome acessível começa pelo texto visível (WCAG 2.5.3: quem usa comando de voz fala o que vê).
          aria-label={showDate ? `${formatShortDay(activeDay, locale)} (${t.dates.otherDate})` : undefined}
          onClick={() => setPickerOpen((open) => !open)}
          className={`${ITEM} tabular-nums xl:col-span-full ${isCustom ? TOOL_ACTIVE : TOOL_IDLE}`}
        >
          <CalendarDotsIcon className="size-5 shrink-0" aria-hidden="true" />
          {showDate ? formatShortDay(activeDay, locale) : t.dates.otherDate}
        </button>
      </div>
      {pickerOpen && <DatePickerPopup value={activeDay} onSelect={onSelect} onClose={closePicker} containerRef={containerRef} />}
    </div>
  )
}
