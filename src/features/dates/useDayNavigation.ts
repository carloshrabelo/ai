import { useQueryClient } from '@tanstack/react-query'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { IsoDate } from '../../lib/dates'
import { eventsInfiniteQueryOptions } from '../../api/queries'
import { useFocusedDay } from './focusedDayStore'

const DAY_HEADINGS = '[data-day]'
/**
 * A rolagem programada é dada por terminada quando a página fica parada por este tempo. Não usa
 * `scrollend`: o último `scroll` agendava a atualização para o frame seguinte, que rodava já sem a
 * trava e marcava o dia anterior quando a página não conseguia rolar até o dia (fim da lista).
 */
const SCROLL_SETTLE_MS = 200

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Posição do título do dia na página (relativa à janela), como se não fosse `sticky`. Os títulos do
 * feed grudam no topo e ficam todos grudados (estão na mesma grade): um dia que já passou mede a
 * posição grudada, não a dele, e "voltar para um dia anterior" não rolava. Desligar o sticky só
 * durante a medição força um recálculo de layout, sem pintar nada.
 */
function naturalTop(element: HTMLElement): number {
  const previous = element.style.position
  element.style.position = 'static'
  const top = element.getBoundingClientRect().top
  element.style.position = previous
  return top
}

/** Onde termina a área fixa quando está grudada no topo (independe da rolagem atual). */
function stuckBottom(element: HTMLElement | null): number {
  if (!element) return 0
  return (Number.parseFloat(getComputedStyle(element).top) || 0) + element.offsetHeight
}

/**
 * Dia ativo do feed e seleção de dia.
 * - `activeDay` acompanha o cabeçalho de dia que está no topo da tela, logo abaixo da área fixa.
 * - `selectDay`: se o dia já foi carregado, só rola até ele; senão (antes do início ou depois do que
 *   foi carregado), começa um feed novo (?date=).
 * - Enquanto a página rola até o dia escolhido, o dia ativo fica nele: os cabeçalhos que passam pelo
 *   caminho não mexem na faixa de dias (antes, a faixa "corria" atrás de cada dia intermediário).
 * - O dia ativo é guardado no focusedDayStore: ao voltar do mapa (ou de outra página), a agenda
 *   reabre no mesmo dia em vez de hoje.
 */
export function useDayNavigation(startDate: IsoDate, stickyRef: RefObject<HTMLElement | null>) {
  const [searchParams, setSearchParams] = useSearchParams()
  // Dia a restaurar ao voltar de outra página sem ?date na URL (ver o efeito no fim).
  const [restoreDay] = useState(() => (searchParams.has('date') ? null : useFocusedDay.getState().day))
  const restore = useRef(restoreDay)
  const [activeDay, setActiveDayState] = useState(() => (restoreDay && restoreDay > startDate ? restoreDay : startDate))
  const queryClient = useQueryClient()
  const setFocusedDay = useFocusedDay((state) => state.setDay)
  /** Rolagem programada em andamento: o scroll-spy espera ela terminar. */
  const scrollLock = useRef<{ timer: number } | null>(null)

  const setActiveDay = useCallback(
    (day: IsoDate) => {
      setActiveDayState(day)
      setFocusedDay(day)
    },
    [setFocusedDay],
  )

  const releaseLock = useCallback(() => {
    if (!scrollLock.current) return
    window.clearTimeout(scrollLock.current.timer)
    scrollLock.current = null
  }, [])

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      if (scrollLock.current) {
        // Ainda rolando até o dia escolhido: estende a trava até a página parar.
        window.clearTimeout(scrollLock.current.timer)
        scrollLock.current.timer = window.setTimeout(releaseLock, SCROLL_SETTLE_MS)
        return
      }
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
    // O usuário mexeu na página durante a rolagem programada: volta a seguir a rolagem dele.
    const onUserScroll = () => releaseLock()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onUserScroll, { passive: true })
    window.addEventListener('touchstart', onUserScroll, { passive: true })
    window.addEventListener('keydown', onUserScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onUserScroll)
      window.removeEventListener('touchstart', onUserScroll)
      window.removeEventListener('keydown', onUserScroll)
      cancelAnimationFrame(frame)
      releaseLock()
    }
  }, [stickyRef, setActiveDay, releaseLock])

  const selectDay = useCallback(
    (day: IsoDate, { instant = false }: { instant?: boolean } = {}) => {
      const data = queryClient.getQueryData(eventsInfiniteQueryOptions(startDate).queryKey)
      const loadedEnd = data?.pages.at(-1)?.end

      if (loadedEnd && day >= startDate && day < loadedEnd) {
        // Primeiro cabeçalho no dia escolhido ou depois (o dia pode não ter eventos).
        const target = [...document.querySelectorAll<HTMLElement>(DAY_HEADINGS)].find((heading) => (heading.dataset.day ?? '') >= day)
        if (target) {
          setActiveDay(day)
          // Desconta a área fixa (header + atalhos/faixa), que muda de altura conforme o breakpoint.
          const offset = stuckBottom(stickyRef.current) + 8
          const top = Math.max(0, window.scrollY + naturalTop(target) - offset)
          const smooth = !instant && !prefersReducedMotion()
          // Também sem animação: o `scroll` chega depois e marcaria o dia seguinte (o escolhido pode não ter eventos).
          if (Math.abs(top - window.scrollY) > 1) {
            releaseLock()
            scrollLock.current = { timer: window.setTimeout(releaseLock, SCROLL_SETTLE_MS * 3) }
          }
          window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
          return
        }
      }

      setFocusedDay(day)
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
    [queryClient, setSearchParams, startDate, stickyRef, setActiveDay, setFocusedDay, releaseLock],
  )

  // Voltando de outra página (ex.: mapa) sem ?date na URL: reabre no último dia em foco, não em hoje.
  // Só na montagem; espera o feed ter os cabeçalhos (o dia pode estar no meio da primeira janela).
  useEffect(() => {
    const day = restore.current
    if (!day || day === startDate) {
      restore.current = null
      return
    }
    const data = queryClient.getQueryData(eventsInfiniteQueryOptions(startDate).queryKey)
    const loadedEnd = data?.pages.at(-1)?.end
    // Fora do que existe/foi carregado: recomeça o feed no dia (vira ?date=).
    if (day < startDate || (loadedEnd && day >= loadedEnd)) {
      restore.current = null
      selectDay(day, { instant: true })
      return
    }
    // Dentro da janela: rola até ele assim que os cabeçalhos aparecerem.
    const tryScroll = () => {
      if (!document.querySelector(DAY_HEADINGS)) return false
      restore.current = null
      selectDay(day, { instant: true })
      return true
    }
    if (tryScroll()) return
    const observer = new MutationObserver(() => {
      if (tryScroll()) observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [queryClient, selectDay, startDate])

  return { activeDay, selectDay }
}
