import { type ReactNode, useRef } from 'react'
import { useModalTransition } from './useModalTransition'

type Props = {
  id?: string
  /** Nome acessível do painel. */
  label: string
  onClose: () => void
  children: ReactNode
  /** Rodapé fixo; recebe `close`, que fecha com animação (ex.: botão "Ver eventos"). */
  footer?: (close: () => void) => ReactNode
}

/**
 * Painel que sobe de baixo (bottom sheet), em <dialog> modal: foco preso dentro, Esc fecha,
 * tocar fora (no fundo escurecido) fecha e a página por trás não rola. Sobe e desce animado,
 * com o fundo escurecendo e clareando junto.
 */
export function BottomSheet({ id, label, onClose, children, footer }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { visible, requestClose } = useModalTransition(dialogRef, onClose)

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault() // Esc: fecha com animação
        requestClose()
      }}
      // Clique no próprio <dialog> (e não no conteúdo) = clique no fundo escurecido.
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose()
      }}
      className={`fixed inset-x-0 top-auto bottom-0 m-0 flex max-h-[85dvh] w-full max-w-none flex-col rounded-t-2xl bg-surface p-0 pb-[env(safe-area-inset-bottom)] text-fg shadow-xl transition-transform duration-300 ease-out backdrop:bg-black/40 backdrop:transition-opacity backdrop:duration-300 md:mx-auto md:max-w-2xl ${
        visible ? 'translate-y-0 backdrop:opacity-100' : 'translate-y-full backdrop:opacity-0'
      }`}
    >
      {/* Alça visual de "puxar". */}
      <div aria-hidden="true" className="flex shrink-0 justify-center pt-2 pb-1">
        <span className="h-1 w-10 rounded-full bg-border" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      {footer && <div className="shrink-0 border-t border-border px-4 py-3">{footer(requestClose)}</div>}
    </dialog>
  )
}
