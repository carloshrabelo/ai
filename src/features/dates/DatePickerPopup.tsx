import { type RefObject, useEffect } from 'react'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { useMediaQuery, XL_QUERY } from '../../hooks/useMediaQuery'
import { useI18n } from '../../i18n/useI18n'
import { agendaToday, type IsoDate } from '../../lib/dates'
import { CalendarPicker } from './CalendarPicker'

type Props = {
  value: IsoDate
  onSelect: (day: IsoDate) => void
  onClose: () => void
  /** Elemento com o botão que abriu e o popover (posicionado: `relative`). Clique fora dele fecha. */
  containerRef: RefObject<HTMLElement | null>
}

/**
 * Calendário para escolher um dia: popover logo abaixo do botão a partir de `xl` (Esc ou clique fora
 * fecham) e, abaixo disso, folha que sobe de baixo. Usado pela faixa de dias e por "Outra data".
 */
export function DatePickerPopup({ value, onSelect, onClose, containerRef }: Props) {
  const { t } = useI18n()
  const isXl = useMediaQuery(XL_QUERY)

  useEffect(() => {
    if (!isXl) return
    const onPointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [isXl, containerRef, onClose])

  const pick = (day: IsoDate) => {
    onClose()
    onSelect(day)
  }
  const picker = <CalendarPicker value={value} today={agendaToday()} onSelect={pick} />

  if (isXl) {
    return (
      <div
        role="dialog"
        aria-label={t.dates.pickDate}
        className="absolute top-full left-0 z-20 mt-2 rounded-2xl border-2 border-b-4 border-border bg-surface p-3 shadow-md"
      >
        {picker}
      </div>
    )
  }
  return (
    <BottomSheet label={t.dates.pickDate} onClose={onClose}>
      <div className="flex justify-center pt-2">{picker}</div>
    </BottomSheet>
  )
}
