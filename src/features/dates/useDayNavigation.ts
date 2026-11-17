import { useQueryClient } from '@tanstack/react-query'
import { type RefObject, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { IsoDate } from '../../data/dates'
import { eventsInfiniteQueryOptions } from '../../data/queries'

const DAY_HEADINGS = '[data-day]'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Onde termina a área fixa quando está grudada no topo (independe da rolagem atual). */
function stuckBottom(element: HTMLElement | null): number {
  if (!element) return 0
  return (Number.parseFloat(getComputedStyle(element).top) || 0) + element.offsetHeight
}

/**
 * Dia ativo do feed e seleção de dia.
 * - `activeDay` acompanha o cabeçalho de dia que está no topo da tela, logo abaixo da área fixa.
 * - `selectDay`: se o dia já foi carregado, só rola até ele; senão, começa um feed novo (?date=).
 */
export function useDayNavigation(startDate: IsoDate, stickyRef: RefObject<HTMLElement | null>) {
  const [activeDay, setActiveDay] = useState(startDate)
  const [, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const top = stuckBottom(stickyRef.current) + 8
      const headings = document.querySelectorAll<HTMLElement>(DAY_HEADINGS)
      let current: string | undefined
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > top) break
        current = heading.dataset.day
      }
      if (current) setActiveDay(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [stickyRef])

  const selectDay = useCallback(
    (day: IsoDate) => {
      const data = queryClient.getQueryData(eventsInfiniteQueryOptions(startDate).queryKey)
      const loadedEnd = data?.pages.at(-1)?.end

      if (loadedEnd && day >= startDate && day < loadedEnd) {
        // Primeiro cabeçalho no dia escolhido ou depois (o dia pode não ter eventos).
        const target = [...document.querySelectorAll<HTMLElement>(DAY_HEADINGS)].find(
          (heading) => (heading.dataset.day ?? '') >= day,
        )
        if (target) {
          // Desconta a área fixa (header + atalhos/faixa), que muda de altura conforme o breakpoint.
          const offset = stuckBottom(stickyRef.current) + 8
          window.scrollTo({
            top: window.scrollY + target.getBoundingClientRect().top - offset,
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          })
          setActiveDay(day)
          return
        }
      }

      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          next.set('date', day)
          return next
        },
        { preventScrollReset: false },
      )
      window.scrollTo({ top: 0 })
    },
    [queryClient, setSearchParams, startDate, stickyRef],
  )

  return { activeDay, selectDay }
}
