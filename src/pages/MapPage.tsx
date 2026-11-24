import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from 'react'
import { Navigate, useLoaderData, useLocation, useNavigate, useSearchParams } from 'react-router'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { type IsoDate, isIsoDate } from '../lib/dates'
import type { EventsLoaderData } from '../api/eventsLoader'
import { toSearchString } from '../domain/genreFilter'
import { useFocusedDay } from '../features/dates/focusedDayStore'
import { WeekStrip } from '../features/dates/WeekStrip'
import { EventCard } from '../features/events/EventCard'
import { eventFocus } from '../features/events/eventFocusStore'
import { useDayEvents } from '../features/events/useDayEvents'
import { eventPath } from '../features/events/useSelectedEvent'
import { GenreFilter } from '../features/genres/GenreFilter'
import { GenreFilterButton } from '../features/genres/GenreFilterButton'
import { useGenreFilter } from '../features/genres/useGenreFilter'
import { useGeocodedEvents } from '../features/location/useGeocodedEvents'
import { MD_QUERY, useMediaQuery } from '../hooks/useMediaQuery'
import { useI18n } from '../i18n/useI18n'
import { siteUrl, useDocumentHead } from '../seo/useDocumentHead'

// Leaflet só é baixado quando o mapa aparece.
const EventsMap = lazy(() => import('../features/map/EventsMap'))

/** Dia escolhido na faixa (?day=), dentro do feed que começa em ?date=. */
const DAY_PARAM = 'day'

/**
 * Rota /map (celular): faixa de dias em cima, mapa no meio e os eventos do dia num
 * carrossel embaixo. O card visível no carrossel fica em foco no mapa; tocar num pino traz o
 * card dele; tocar no card abre os detalhes. A partir de `md` (tablet) o mapa já está na agenda.
 */
export default function MapPage() {
  const { startDate } = useLoaderData() as EventsLoaderData
  const location = useLocation()
  const isMd = useMediaQuery(MD_QUERY)
  if (isMd) return <Navigate to={{ pathname: '/', search: location.search }} replace />
  return <DayMap key={startDate} startDate={startDate} />
}

function DayMap({ startDate }: { startDate: IsoDate }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { selected: genres } = useGenreFilter()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersId = useId()
  const carouselTitleId = useId()

  useDocumentHead({ title: t.seo.mapTitle, description: t.seo.mapDescription, canonical: `${siteUrl()}map/` })
  // Saindo da página, limpa só o hover. A seleção não é desta página: um reset aqui roda depois de a
  // agenda ler o evento da URL (/event/<slug>/) e fecharia os detalhes recém-abertos.
  useEffect(
    () => () => {
      eventFocus.unhover('list')
      eventFocus.unhover('map')
    },
    [],
  )

  const dayParam = searchParams.get(DAY_PARAM)
  const day: IsoDate = isIsoDate(dayParam) && dayParam >= startDate ? dayParam : startDate

  const { events, isPending, isError, refetch, loadedEnd } = useDayEvents(startDate, day, genres)

  /**
   * Busca de datas independente da agenda: dia dentro do que já foi carregado → só troca ?day=; antes
   * do início ou depois do carregado (seletor de data, ou dias anteriores da faixa) → a janela passa
   * a começar nesse dia (?date=) e o loader busca os eventos dele.
   */
  const selectDay = useCallback(
    (next: IsoDate) => {
      const params = new URLSearchParams(searchParams)
      if (next < startDate || (loadedEnd && next >= loadedEnd)) {
        params.set('date', next)
        params.delete(DAY_PARAM)
      } else if (next === startDate) params.delete(DAY_PARAM)
      else params.set(DAY_PARAM, next)
      setSearchParams(params, { replace: true, preventScrollReset: true })
    },
    [searchParams, setSearchParams, startDate, loadedEnd],
  )

  // Dia em foco compartilhado com a agenda: abrir o mapa (sem ?day/?date na URL) continua no dia que
  // estava na agenda, e voltar para a agenda continua no dia escolhido aqui.
  const setFocusedDay = useFocusedDay((state) => state.setDay)
  const restore = useRef(searchParams.has(DAY_PARAM) || searchParams.has('date') ? null : useFocusedDay.getState().day)
  useEffect(() => {
    const target = restore.current
    if (!target) return
    // Depois do início: espera saber até onde a janela vai (dentro → ?day=; depois → ?date=).
    if (target > startDate && isPending) return
    restore.current = null
    if (target !== startDate) selectDay(target)
  }, [isPending, selectDay, startDate])
  useEffect(() => setFocusedDay(day), [day, setFocusedDay])
  const { events: mapEvents } = useGeocodedEvents(events)

  // Card em foco no carrossel (o mais visível). Volta ao primeiro quando o dia muda.
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const active = events.some((event) => event.slug === activeSlug) ? activeSlug : (events[0]?.slug ?? null)

  const carouselRef = useRef<HTMLUListElement>(null)
  const [carouselHeight, setCarouselHeight] = useState(0)

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return
    const resize = new ResizeObserver(() => setCarouselHeight(carousel.offsetHeight))
    resize.observe(carousel)
    const visible = new IntersectionObserver(
      (entries) => {
        const best = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const slug = (best?.target as HTMLElement | undefined)?.dataset.slug
        if (slug) setActiveSlug(slug)
      },
      { root: carousel, threshold: 0.6 },
    )
    for (const item of carousel.querySelectorAll('[data-slug]')) visible.observe(item)
    return () => {
      resize.disconnect()
      visible.disconnect()
    }
  }, [events])

  // Volta o carrossel ao início ao trocar de dia.
  useEffect(() => {
    carouselRef.current?.scrollTo({ left: 0 })
  }, [day])

  /** Pino tocado: traz o card do evento para o centro do carrossel. */
  const showCard = useCallback((slug: string) => {
    setActiveSlug(slug)
    carouselRef.current
      ?.querySelector<HTMLElement>(`[data-slug="${CSS.escape(slug)}"]`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [])

  /** Card tocado: abre os detalhes (o "voltar" fecha e retorna ao mapa no mesmo dia). */
  const openEvent = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams)
      params.delete(DAY_PARAM)
      navigate({ pathname: eventPath(slug), search: toSearchString(params) }, { state: { openedFromList: true } })
    },
    [navigate, searchParams],
  )

  return (
    // Ocupa a tela entre o header e a barra inferior.
    <div className="fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] bottom-[calc(4rem+env(safe-area-inset-bottom))] flex flex-col">
      <div className="bg-bg px-4 py-2 md:px-6">
        <WeekStrip
          startDate={startDate}
          activeDay={day}
          onSelect={selectDay}
          actions={
            <GenreFilterButton
              open={filtersOpen}
              onToggle={() => setFiltersOpen((value) => !value)}
              controls={filtersId}
              activeCount={genres.length}
            />
          }
        />
        {filtersOpen && (
          <BottomSheet
            id={filtersId}
            label={t.filters.title}
            onClose={() => setFiltersOpen(false)}
            footer={(close) => (
              <Button className="w-full" onClick={close}>
                {t.filters.done(events.length)}
              </Button>
            )}
          >
            <GenreFilter plain />
          </BottomSheet>
        )}
      </div>

      <section aria-label={t.map.label} className="relative isolate min-h-0 flex-1 bg-genre-neutral">
        <Suspense fallback={<div aria-hidden="true" className="h-full w-full animate-pulse bg-genre-neutral" />}>
          <EventsMap
            events={mapEvents}
            onOpenEvent={showCard}
            activeSlug={active}
            inset={{ top: 40, bottom: carouselHeight + 24 }}
            zoomPosition="topright"
            focusSelected={false}
          />
        </Suspense>

        {/* Posição no carrossel ("2 / 6"), logo acima dele. */}
        {events.length > 1 && (
          <p
            aria-hidden="true"
            style={{ bottom: carouselHeight + 4 }}
            className="absolute left-4 z-[1000] rounded-xl border-2 border-border bg-surface px-2 py-0.5 text-xs font-bold tabular-nums md:left-6"
          >
            {Math.max(1, events.findIndex((event) => event.slug === active) + 1)} / {events.length}
          </p>
        )}

        {/* Carrossel por cima do mapa (Leaflet usa z-index até 1000 dentro do próprio contexto). */}
        <h2 id={carouselTitleId} className="sr-only">
          {t.mapPage.events}
        </h2>
        <ul
          ref={carouselRef}
          aria-labelledby={carouselTitleId}
          // Grid: todos os cards com a altura do maior. pt-3: espaço para o contorno do selecionado (a
          // lista rola na horizontal e corta o que passa da borda).
          className={`absolute inset-x-0 bottom-0 z-[1000] grid snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pt-3 pb-3 [scrollbar-width:none] md:scroll-px-6 md:px-6 ${
            events.length === 0 ? 'grid-cols-1' : 'auto-cols-[85%] grid-flow-col sm:auto-cols-[24rem]'
          }`}
        >
          {events.length === 0 ? (
            <li>
              {isError ? (
                <Card role="alert" className="flex flex-col items-center gap-2 text-center text-sm text-fg-muted">
                  {t.feed.loadError}
                  <Button variant="secondary" onClick={() => void refetch()}>
                    {t.feed.retry}
                  </Button>
                </Card>
              ) : (
                <Card role="status" className="text-center text-sm text-fg-muted">
                  {isPending ? t.map.loading : t.map.none}
                </Card>
              )}
            </li>
          ) : (
            events.map((event) => {
              const located = mapEvents.find((e) => e.id === event.id)?.venue?.lat !== undefined
              return (
                <li
                  key={event.id}
                  data-slug={event.slug}
                  className={`grid snap-center rounded-2xl transition-opacity ${
                    event.slug === active ? 'ring-2 ring-brand' : 'opacity-85'
                  }`}
                >
                  <EventCard event={event} onOpen={openEvent} clampTitle />
                  {!located && <span className="sr-only">{t.mapPage.noLocation}</span>}
                </li>
              )
            })
          )}
        </ul>
      </section>
    </div>
  )
}
