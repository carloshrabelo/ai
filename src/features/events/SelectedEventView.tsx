import { ArrowLeft, CalendarX, X } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef } from 'react'
import { IconButton } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import type { IsoDate } from '../../data/dates'
import { useModalTransition } from '../../components/ui/useModalTransition'
import { EventDetails, EventDetailsSkeleton } from './EventDetails'
import { useEventBySlug } from './useEventBySlug'
import { useI18n } from '../../i18n/useI18n'

type ViewProps = { startDate: IsoDate; slug: string; onClose: () => void }

function DetailsBody({ startDate, slug, headingId }: { startDate: IsoDate; slug: string; headingId: string }) {
  const { t } = useI18n()
  const event = useEventBySlug(startDate, slug)
  if (event === undefined) return <EventDetailsSkeleton />
  if (event === null) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-fg-muted">
        <CalendarX className="size-12" aria-hidden="true" />
        <h2 id={headingId} tabIndex={-1} className="text-sm outline-none">
          {t.event.notFound}
        </h2>
      </div>
    )
  }
  return <EventDetails event={event} headingId={headingId} />
}

/** A partir de `xl`: os detalhes ocupam a coluna do mapa. */
export function EventDetailsPanel({
  startDate,
  slug,
  onClose,
  className = 'flex-1',
}: ViewProps & { className?: string }) {
  const headingId = useId()
  const { t } = useI18n()

  // Leva o foco para o título ao abrir/trocar de evento.
  useEffect(() => {
    document.getElementById(headingId)?.focus({ preventScroll: true })
  }, [slug, headingId])

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
        <p className="text-sm font-semibold text-fg-muted">{t.event.details}</p>
        <IconButton label={t.event.closeDetails} icon={<X className="size-5" aria-hidden="true" />} onClick={onClose} />
      </div>
      <DetailsBody startDate={startDate} slug={slug} headingId={headingId} />
    </Card>
  )
}

/** Abaixo de `xl`: os detalhes abrem como uma página num drawer que entra pela direita. */
export function EventDetailsDrawer({ startDate, slug, onClose }: ViewProps) {
  const headingId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
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
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
      className={`fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-bg p-0 text-fg transition-transform duration-300 ease-out backdrop:bg-black/40 backdrop:transition-opacity backdrop:duration-300 ${
        visible ? 'translate-x-0 backdrop:opacity-100' : 'translate-x-full backdrop:opacity-0'
      }`}
    >
      <DrawerHeader onClose={requestClose} />
      <div className="mx-auto max-w-3xl px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:px-6">
        <DetailsBody startDate={startDate} slug={slug} headingId={headingId} />
      </div>
    </dialog>
  )
}

function DrawerHeader({ onClose }: { onClose: () => void }): ReactNode {
  const { t } = useI18n()
  return (
    <header className="sticky top-0 z-10 bg-header pt-[env(safe-area-inset-top)] text-header-fg shadow-sm dark:shadow-none">
      <div className="flex h-14 items-center gap-2 px-2 md:px-4">
        <IconButton
          label={t.event.back}
          icon={<ArrowLeft className="size-6" aria-hidden="true" />}
          onClick={onClose}
          className="text-header-fg hover:bg-white/10 hover:text-header-fg"
        />
        <p className="truncate text-lg font-semibold">{t.event.details}</p>
      </div>
    </header>
  )
}
