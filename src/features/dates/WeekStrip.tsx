import { useInfiniteQuery } from '@tanstack/react-query'
import { CalendarDotsIcon } from '@phosphor-icons/react'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { useMediaQuery, XL_QUERY } from '../../hooks/useMediaQuery'
import { type GenreFilterValue, matchesGenres } from '../../domain/genreFilter'
import { groupByDay } from '../events/groupByDay'
import { CalendarPicker } from './CalendarPicker'
import { IconButton } from '../../components/ui/Button'
import { WINDOW_DAYS } from '../../api/config'
import { addDays, type IsoDate, todayIso } from '../../lib/dates'
import { eventsInfiniteQueryOptions, flattenEvents } from '../../api/queries'
import { formatDayHeading, formatDayOfMonth, formatWeekdayShort } from '../events/format'
import { useI18n } from '../../i18n/useI18n'

type Props = {
  startDate: IsoDate
  activeDay: IsoDate
  onSelect: (day: IsoDate) => void
  /** Filtro de gêneros: os pontos de "tem evento" seguem o mesmo filtro da lista. */
  genres?: readonly GenreFilterValue[]
  /** Ações depois da faixa (ex.: botão de filtros). */
  actions?: ReactNode
}

const NO_GENRES: readonly GenreFilterValue[] = []
const FADE = 24

/**
 * Botão de calendário + faixa de dias, do início do feed até o fim do que já foi carregado. As bordas
 * da faixa esmaecem quando há mais dias para aquele lado. Os pontos de "tem evento" ficam só no
 * calendário do mês.
 */
export function WeekStrip({ startDate, activeDay, onSelect, genres = NO_GENRES, actions }: Props) {
  const { t, locale } = useI18n()
  const isXl = useMediaQuery(XL_QUERY)
  // Só lê o cache (mesma query do feed): a faixa cresce conforme novas janelas chegam.
  const { data } = useInfiniteQuery(eventsInfiniteQueryOptions(startDate))
  const end = data?.pages.at(-1)?.end ?? addDays(startDate, WINDOW_DAYS)
  const days: IsoDate[] = []
  for (let day = startDate; day < end; day = addDays(day, 1)) days.push(day)

  const eventDays = useMemo(() => {
    const filtered = flattenEvents(data?.pages ?? []).filter((event) => matchesGenres(event.genres, genres))
    return new Set(groupByDay(filtered, startDate, end).map((group) => group.day))
  }, [data, genres, startDate, end])

  const stripRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const updateEdges = useCallback(() => {
    const strip = stripRef.current
    if (!strip) return
    const start = strip.scrollLeft > 1
    const endEdge = strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1
    setEdges((current) => (current.start === start && current.end === endEdge ? current : { start, end: endEdge }))
  }, [])

  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    updateEdges()
    const observer = new ResizeObserver(updateEdges)
    observer.observe(strip)
    return () => observer.disconnect()
  }, [updateEdges, days.length])

  // Mantém o dia ativo visível na faixa, sem rolar a página.
  useEffect(() => {
    const strip = stripRef.current
    const item = strip?.querySelector<HTMLElement>(`[data-strip-day="${activeDay}"]`)
    if (!strip || !item) return
    strip.scrollTo({ left: item.offsetLeft - strip.clientWidth / 2 + item.clientWidth / 2, behavior: 'smooth' })
  }, [activeDay])

  // Popover (desktop): fecha com Esc ou clique fora.
  useEffect(() => {
    if (!pickerOpen || !isXl) return
    const onPointer = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen, isXl])

  const pick = (day: IsoDate) => {
    setPickerOpen(false)
    onSelect(day)
  }
  const picker = <CalendarPicker value={activeDay} today={todayIso()} eventDays={eventDays} onSelect={pick} />
  const mask = `linear-gradient(to right, ${edges.start ? 'transparent' : 'black'}, black ${FADE}px, black calc(100% - ${FADE}px), ${edges.end ? 'transparent' : 'black'})`

  return (
    <div ref={pickerRef} className="relative flex items-center gap-2">
      <IconButton
        label={t.dates.pickDate}
        variant="tool"
        aria-expanded={pickerOpen}
        aria-haspopup="dialog"
        icon={<CalendarDotsIcon className="size-6" aria-hidden="true" />}
        onClick={() => setPickerOpen((open) => !open)}
        className="size-14"
      />
      {pickerOpen && isXl && (
        <div
          role="dialog"
          aria-label={t.dates.pickDate}
          className="absolute top-full left-0 z-20 mt-2 rounded-2xl border-2 border-b-4 border-border bg-surface p-3 shadow-md"
        >
          {picker}
        </div>
      )}
      {pickerOpen && !isXl && (
        <BottomSheet label={t.dates.pickDate} onClose={() => setPickerOpen(false)}>
          <div className="flex justify-center pt-2">{picker}</div>
        </BottomSheet>
      )}

      {/* Moldura dos cards e botões (borda de 2px, base de 4px). Altura total 56px, igual aos botões ao
          lado: 2 + 4 de borda, 4 + 4 de padding e 42px de dia. A moldura fica por fora e a rolagem por
          dentro, para o degradê das bordas não apagar a borda. */}
      <div className="min-w-0 flex-1 rounded-2xl border-2 border-b-4 border-border bg-surface p-1">
        <ul
          ref={stripRef}
          aria-label={t.dates.days}
          onScroll={updateEdges}
          style={{ maskImage: mask, WebkitMaskImage: mask }}
          className="flex snap-x scroll-px-1 gap-1 overflow-x-auto px-1 [scrollbar-width:none]"
        >
          {days.map((day) => {
            const active = day === activeDay
            return (
              <li key={day} data-strip-day={day} className="flex-1 shrink-0 snap-start">
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={formatDayHeading(day, locale)}
                  onClick={() => {
                    onSelect(day)
                  }}
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
