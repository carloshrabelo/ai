import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'

/** Duração das animações de entrada e saída (igual ao `duration-300` das classes). */
export const MODAL_TRANSITION_MS = 300

/**
 * Abre um <dialog> como modal com animação de entrada e saída.
 * - Entrada: o dialog monta "fechado" (fora da tela) e no quadro seguinte passa a `visible`.
 * - Saída: `requestClose` volta para `visible = false`, espera a transição e só então chama
 *   `onClose` (que desmonta o componente).
 * Também trava a rolagem da página por trás enquanto o modal está aberto.
 * Com "reduzir movimento", a duração cai para quase zero pelo CSS global e o fechamento é imediato.
 */
export function useModalTransition(dialogRef: RefObject<HTMLDialogElement | null>, onClose: () => void) {
  const [visible, setVisible] = useState(false)
  const closing = useRef(false)
  // Sempre a versão mais recente de onClose, sem refazer o efeito de abertura.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    // Dois quadros: o primeiro pinta o estado inicial, o segundo dispara a transição.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setVisible(true))
    })
    return () => {
      cancelAnimationFrame(frame)
      root.style.overflow = previous
    }
  }, [dialogRef])

  const requestClose = useCallback(() => {
    if (closing.current) return
    closing.current = true
    setVisible(false)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(() => onCloseRef.current(), reduced ? 0 : MODAL_TRANSITION_MS)
  }, [])

  return { visible, requestClose }
}
