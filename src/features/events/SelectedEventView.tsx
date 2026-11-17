import { ArrowLeft, CalendarX, X } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef } from 'react'
import { IconButton } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import type { IsoDate } from '../../data/dates'
import { EventDetails, EventDetailsSkeleton } from './EventDetails'
import { useEventById } from './useEventById'

type ViewProps = { startDate: IsoDate; eventId: string; onClose: () => void }

function DetailsBody({ startDate, eventId, headingId }: { startDate: IsoDate; eventId: string; headingId: string }) {
  const event = useEventById(startDate, eventId)
  if (event === undefined) return <EventDetailsSkeleton />
  if (event === null) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-fg-muted">
        <CalendarX className="size-12" aria-hidden="true" />
        <h2 id={headingId} tabIndex={-1} className="text-sm outline-none">
          Evento não encontrado nas datas carregadas.
        </h2>
      </div>
    )
  }
  return <EventDetails event={event} headingId={headingId} />
}

/** A partir de `xl`: os detalhes ocupam a coluna do mapa. */
export function EventDetailsPanel({
  startDate,
  eventId,
  onClose,
  className = 'flex-1',
}: ViewProps & { className?: string }) {
  const headingId = useId()

  // Leva o foco para o título ao abrir/trocar de evento.
  useEffect(() => {
    document.getElementById(headingId)?.focus({ preventScroll: true })
  }, [eventId, headingId])

  return (
    <Card
      variant="panel"
      as="section"
      aria-labelledby={headingId}
      className={`min-h-0 overflow-x-hidden overflow-y-auto ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div className="-mt-2 mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-fg-muted">Detalhes do evento</p>
        <IconButton label="Fechar detalhes" icon={<X className="size-5" aria-hidden="true" />} onClick={onClose} />
      </div>
      <DetailsBody startDate={startDate} eventId={eventId} headingId={headingId} />
    </Card>
  )
}

/** Abaixo de `xl`: os detalhes abrem como uma página num drawer que entra pela direita. */
export function EventDetailsDrawer({ startDate, eventId, onClose }: ViewProps) {
  const headingId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    // A página por trás não rola enquanto o drawer está aberto.
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    document.getElementById(headingId)?.focus({ preventScroll: true })
    return () => {
      root.style.overflow = previous
    }
  }, [headingId])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      // Esc: o navegador fecharia o <dialog> sozinho; quem fecha é a URL.
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none translate-x-0 overflow-y-auto bg-bg p-0 text-fg transition-transform duration-300 ease-out backdrop:bg-transparent starting:open:translate-x-full"
    >
      <DrawerHeader onClose={onClose} />
      <div className="mx-auto max-w-3xl px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:px-6">
        <DetailsBody startDate={startDate} eventId={eventId} headingId={headingId} />
      </div>
    </dialog>
  )
}

function DrawerHeader({ onClose }: { onClose: () => void }): ReactNode {
  return (
    <header className="sticky top-0 z-10 bg-header pt-[env(safe-area-inset-top)] text-header-fg shadow-sm dark:shadow-none">
      <div className="flex h-14 items-center gap-2 px-2 md:px-4">
        <IconButton
          label="Voltar"
          icon={<ArrowLeft className="size-6" aria-hidden="true" />}
          onClick={onClose}
          className="text-header-fg hover:bg-white/10 hover:text-header-fg"
        />
        <p className="truncate text-lg font-semibold">Detalhes do evento</p>
      </div>
    </header>
  )
}
