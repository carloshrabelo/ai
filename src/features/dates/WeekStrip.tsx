import { useInfiniteQuery } from '@tanstack/react-query'
import { CalendarDotsIcon } from '@phosphor-icons/react'
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { IconButton } from '../../components/ui/Button'
import { WINDOW_DAYS } from '../../api/config'
import { addDays, type IsoDate } from '../../lib/dates'
import { eventsInfiniteQueryOptions } from '../../api/queries'
import { formatDayHeading, formatDayOfMonth, formatWeekdayShort } from '../events/format'
import { useI18n } from '../../i18n/useI18n'
import { DatePickerPopup } from './DatePickerPopup'
import { track } from '../../analytics/track'

type Props = {
  startDate: IsoDate
  activeDay: IsoDate
  onSelect: (day: IsoDate) => void
  /** Ações depois da faixa (ex.: botão de filtros). */
  actions?: ReactNode
}

const FADE = 24
/** Dias antes do início do feed mostrados na faixa. Escolher um deles recomeça o feed nesse dia. */
const PAST_DAYS = 7
/** Perto do fim da faixa (px), busca mais 2 semanas: a faixa não depende de a lista ter rolado. */
const LOAD_MORE_AT = 120

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Botão de calendário + faixa de dias: uma semana antes do início do feed até o fim do que já foi
 * carregado (e busca mais ao chegar perto do fim). O dia ativo fica sempre no centro da faixa. As
 * bordas esmaecem quando há mais dias para aquele lado.
 */
export function WeekStrip({ startDate, activeDay, onSelect, actions }: Props) {
  const { t, locale } = useI18n()
  // Mesma query do feed: a faixa cresce conforme novas janelas chegam (pela lista ou pela própria faixa).
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(eventsInfiniteQueryOptions(startDate))
  const end = data?.pages.at(-1)?.end ?? addDays(startDate, WINDOW_DAYS)
  const days: IsoDate[] = []
  for (let day = addDays(startDate, -PAST_DAYS); day < end; day = addDays(day, 1)) days.push(day)

  const stripRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })
  const [pickerOpen, setPickerOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const closePicker = useCallback(() => setPickerOpen(false), [])

  const updateEdges = useCallback(() => {
    const strip = stripRef.current
    if (!strip) return
    const start = strip.scrollLeft > 1
    const endEdge = strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1
    setEdges((current) => (current.start === start && current.end === endEdge ? current : { start, end: endEdge }))
  }, [])

  /**
   * Põe o dia ativo no centro da faixa, sem rolar a página. Mede pela própria faixa (e não por
   * offsetLeft, que conta a partir do contêiner `relative` e incluía a largura do botão do calendário,
   * deixando o dia ~72px à esquerda do centro).
   */
  const center = useCallback(
    (behavior: ScrollBehavior) => {
      const strip = stripRef.current
      const item = strip?.querySelector<HTMLElement>(`[data-strip-day="${activeDay}"]`)
      if (!strip || !item) return
      const stripRect = strip.getBoundingClientRect()
      const itemRect = item.getBoundingClientRect()
      const left = strip.scrollLeft + itemRect.left - stripRect.left - (strip.clientWidth - itemRect.width) / 2
      strip.scrollTo({ left, behavior })
    },
    [activeDay],
  )

  // Mudou a largura (fontes, botões ao lado, rotação): recentra sem animação. Só quando a largura muda
  // de fato: o observer dispara ao ser criado (e é recriado quando chegam mais dias), e recentrar aí
  // puxava a faixa de volta para o dia ativo enquanto o usuário a rolava até o fim.
  const stripWidth = useRef(0)
  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    updateEdges()
    const observer = new ResizeObserver(() => {
      const width = strip.clientWidth
      if (stripWidth.current && width !== stripWidth.current) center('auto')
      stripWidth.current = width
      updateEdges()
    })
    observer.observe(strip)
    return () => observer.disconnect()
  }, [updateEdges, center, days.length])

  // Só ao rolar a faixa (não ao montar ou redimensionar): numa tela larga, a faixa inteira cabe e
  // buscaria janelas sem ninguém pedir.
  const onStripScroll = () => {
    updateEdges()
    const strip = stripRef.current
    if (!strip) return
    const remaining = strip.scrollWidth - strip.clientWidth - strip.scrollLeft
    if (remaining < LOAD_MORE_AT && hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }

  // Dia ativo no centro. Na montagem (e ao trocar o início do feed), vai direto, sem animação: a faixa
  // já aparece centrada. Depois, anima.
  const centered = useRef(false)
  useLayoutEffect(() => {
    center(centered.current && !prefersReducedMotion() ? 'smooth' : 'auto')
    centered.current = true
  }, [center, startDate])

  const mask = `linear-gradient(to right, ${edges.start ? 'transparent' : 'black'}, black ${FADE}px, black calc(100% - ${FADE}px), ${edges.end ? 'transparent' : 'black'})`

  return (
    <div ref={containerRef} className="relative flex items-center gap-2">
      <IconButton
        {...track('dates.calendar-open')}
        label={t.dates.pickDate}
        variant="tool"
        aria-expanded={pickerOpen}
        aria-haspopup="dialog"
        icon={<CalendarDotsIcon className="size-6" aria-hidden="true" />}
        onClick={() => setPickerOpen((open) => !open)}
        className="size-14"
      />
      {pickerOpen && <DatePickerPopup value={activeDay} onSelect={onSelect} onClose={closePicker} containerRef={containerRef} />}

      {/* Moldura dos cards e botões (borda de 2px, base de 4px). Altura total 56px, igual aos botões ao
          lado: 2 + 4 de borda, 4 + 4 de padding e 42px de dia. A moldura fica por fora e a rolagem por
          dentro, para o degradê das bordas não apagar a borda. Sem scroll-snap: o snap puxava a faixa
          para o início do item e tirava o dia ativo do centro. */}
      <div className="min-w-0 flex-1 rounded-2xl border-2 border-b-4 border-border bg-surface px-1.5 py-1">
        <ul
          ref={stripRef}
          aria-label={t.dates.days}
          onScroll={onStripScroll}
          style={{ maskImage: mask, WebkitMaskImage: mask }}
          className="flex gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
        >
          {days.map((day) => {
            const active = day === activeDay
            return (
              <li key={day} data-strip-day={day} className="flex-1 shrink-0">
                <button
                  {...track('dates.strip-day', day)}
                  type="button"
                  aria-pressed={active}
                  aria-label={formatDayHeading(day, locale)}
                  onClick={() => onSelect(day)}
                  className={`relative flex h-10.5 w-full min-w-11 cursor-pointer flex-col items-center justify-center rounded-xl tabular-nums transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand ${
                    active ? 'bg-brand text-brand-fg' : 'text-fg hover:bg-surface-muted'
                  }`}
                >
                  <span className="text-sm leading-tight font-bold">{formatDayOfMonth(day, locale)}</span>
                  <span className={`text-[13px] leading-tight ${active ? '' : 'text-fg-muted'}`}>{formatWeekdayShort(day, locale)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      {actions}
    </div>
  )
}
