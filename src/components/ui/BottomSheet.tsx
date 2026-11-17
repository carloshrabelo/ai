import { type ReactNode, useEffect, useRef } from 'react'

type Props = {
  id?: string
  /** Nome acessível do painel. */
  label: string
  onClose: () => void
  children: ReactNode
  /** Rodapé fixo (ex.: botão "Ver eventos"). */
  footer?: ReactNode
}

/**
 * Painel que sobe de baixo (bottom sheet), em <dialog> modal: foco preso dentro, Esc fecha,
 * tocar fora (no fundo escurecido) fecha e a página por trás não rola.
 */
export function BottomSheet({ id, label, onClose, children, footer }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault() // Esc: quem fecha é o estado da página
        onClose()
      }}
      // Clique no próprio <dialog> (e não no conteúdo) = clique no fundo escurecido.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="fixed inset-x-0 top-auto bottom-0 m-0 flex max-h-[85dvh] w-full max-w-none flex-col rounded-t-2xl bg-surface p-0 pb-[env(safe-area-inset-bottom)] text-fg shadow-xl transition-transform duration-300 ease-out backdrop:bg-black/40 starting:open:translate-y-full md:mx-auto md:max-w-2xl"
    >
      {/* Alça visual de "puxar". */}
      <div aria-hidden="true" className="flex shrink-0 justify-center pt-2 pb-1">
        <span className="h-1 w-10 rounded-full bg-border" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      {footer && <div className="shrink-0 border-t border-border px-4 py-3">{footer}</div>}
    </dialog>
  )
}
