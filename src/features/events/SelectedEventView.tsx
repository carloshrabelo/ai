import { CaretLeftIcon, CalendarXIcon, XIcon } from '@phosphor-icons/react'
import { type ReactNode, type RefObject, useEffect, useId, useLayoutEffect, useRef } from 'react'
import { IconButton } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import type { IsoDate } from '../../lib/dates'
import type { DanceEvent } from '../../domain/event'
import { useModalTransition } from '../../components/ui/useModalTransition'
import { EventDetails, EventDetailsSkeleton } from './EventDetails'
import { useEventBySlug } from './useEventBySlug'
import { useI18n } from '../../i18n/useI18n'
import { track } from '../../analytics/track'

type ViewProps = { startDate: IsoDate; slug: string; onClose: () => void }

/** Evento aberto: undefined enquanto carrega, null se não existe nas datas carregadas. */
type MaybeEvent = DanceEvent | null | undefined

function DetailsBody({ event }: { event: MaybeEvent }) {
  const { t } = useI18n()
  if (event === undefined) return <EventDetailsSkeleton />
  if (event === null) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-fg-muted">
        <CalendarXIcon className="size-12" aria-hidden="true" />
        <p className="text-sm">{t.event.notFound}</p>
      </div>
    )
  }
  // O título fica no header fixo (drawer ou painel), não no corpo.
  return <EventDetails event={event} showTitle={false} />
}

/**
 * Título do evento no header fixo dos detalhes (é o h2 da página: recebe o foco ao abrir). Carregando:
 * barra de skeleton; evento inexistente: "não encontrado".
 */
function HeaderTitle({ event, id, className }: { event: MaybeEvent; id: string; className: string }) {
  const { t } = useI18n()
  return (
    <h2 id={id} tabIndex={-1} className={`min-w-0 flex-1 font-semibold break-words outline-none ${className}`}>
      {event === undefined ? (
        <>
          <span className="sr-only">{t.event.loading}</span>
          <Skeleton className="h-6 w-3/4" />
        </>
      ) : event === null ? (
        t.event.notFound
      ) : (
        event.title
      )}
    </h2>
  )
}

/**
 * Altura do header fixo em `--details-sticky-top`, no contêiner que rola (o pai do header: o card do
 * painel ou o dialog do drawer): a linha de "Abrir no mapa" (EventDetails) gruda logo abaixo do título,
 * que pode ter 1, 2 ou mais linhas. `offset` desconta o padding do contêiner (o header do painel gruda
 * 16px acima, sobre o padding).
 */
function useStickyHeaderHeight(header: RefObject<HTMLElement | null>, offset = 0) {
  useLayoutEffect(() => {
    const element = header.current
    const container = element?.parentElement
    if (!element || !container) return
    const update = () => container.style.setProperty('--details-sticky-top', `${element.offsetHeight + offset}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [header, offset])
}

/** A partir de `xl`: os detalhes ocupam a coluna do mapa. Título e botão de fechar fixos no topo. */
export function EventDetailsPanel({ startDate, slug, onClose, className = 'flex-1' }: ViewProps & { className?: string }) {
  const headingId = useId()
  const { t } = useI18n()
  const event = useEventBySlug(startDate, slug)
  const headerRef = useRef<HTMLDivElement>(null)
  useStickyHeaderHeight(headerRef, -16)

  // Leva o foco para o título ao abrir/trocar de evento.
  useEffect(() => {
    document.getElementById(headingId)?.focus({ preventScroll: true })
  }, [slug, headingId])

  return (
    <Card
      variant="card"
      as="section"
      aria-labelledby={headingId}
      className={`min-h-0 overflow-x-hidden overflow-y-auto pb-0 ${className}`}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === 'Escape') onClose()
      }}
    >
      {/* -top-4 e -mt-4/pt-4: gruda na borda do card, cobrindo o padding (por onde o texto apareceria). */}
      <div ref={headerRef} className="sticky -top-4 z-10 -mx-4 -mt-4 flex items-start gap-2 bg-surface px-4 pt-4 pb-2">
        <HeaderTitle event={event} id={headingId} className="pt-1.5 text-xl" />
        <IconButton
          {...track('event.close')}
          label={t.event.closeDetails}
          icon={<XIcon className="size-5" aria-hidden="true" />}
          onClick={onClose}
        />
      </div>
      <DetailsBody event={event} />
    </Card>
  )
}

/** Abaixo de `xl`: os detalhes abrem como uma página num drawer que entra pela direita. */
export function EventDetailsDrawer({ startDate, slug, onClose }: ViewProps) {
  const headingId = useId()
  const event = useEventBySlug(startDate, slug)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  useStickyHeaderHeight(headerRef)
  // Entra e sai pela direita, como uma página.
  const { visible, requestClose } = useModalTransition(dialogRef, onClose)

  useEffect(() => {
    document.getElementById(headingId)?.focus({ preventScroll: true })
  }, [headingId])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      // Esc: fecha com animação; quem fecha de fato é a URL (onClose).
      onCancel={(cancelEvent) => {
        cancelEvent.preventDefault()
        requestClose()
      }}
      className={`fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-bg p-0 text-fg transition-transform duration-300 ease-out backdrop:bg-black/40 backdrop:transition-opacity backdrop:duration-300 ${
        visible ? 'translate-x-0 backdrop:opacity-100' : 'translate-x-full backdrop:opacity-0'
      }`}
    >
      <DrawerHeader ref={headerRef} onClose={requestClose}>
        <HeaderTitle event={event} id={headingId} className="line-clamp-2 text-lg leading-snug" />
      </DrawerHeader>
      <div className="mx-auto flex min-h-[calc(100dvh-3.5rem-env(safe-area-inset-top))] max-w-3xl flex-col px-4 pt-4">
        <DetailsBody event={event} />
      </div>
    </dialog>
  )
}

/** Header do drawer: voltar + título do evento (até 2 linhas), fixo no topo. */
function DrawerHeader({ ref, onClose, children }: { ref: RefObject<HTMLElement | null>; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n()
  return (
    <header ref={ref} className="sticky top-0 z-10 border-b-2 border-border bg-header pt-[env(safe-area-inset-top)] text-header-fg">
      <div className="flex min-h-14 items-center gap-2 px-2 py-1 md:px-4">
        <IconButton
          {...track('event.close')}
          label={t.event.back}
          icon={<CaretLeftIcon className="size-6" aria-hidden="true" weight="bold" />}
          onClick={onClose}
          className="shrink-0 text-header-fg hover:bg-white/10 hover:text-header-fg"
        />
        {children}
      </div>
    </header>
  )
}
