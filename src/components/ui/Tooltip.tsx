import type { ReactNode } from 'react'

type Props = {
  /** Texto do tooltip. O elemento dentro já deve ter o mesmo texto no aria-label. */
  label: string
  children: ReactNode
  /** Lado onde o tooltip abre e alinhamento horizontal. */
  side?: 'top' | 'bottom'
  align?: 'start' | 'end'
  className?: string
}

/**
 * Tooltip visível na hora, ao passar o mouse ou focar pelo teclado (o `title` nativo demora
 * e quase não se nota). É só visual (aria-hidden): o nome acessível fica no próprio controle.
 */
export function Tooltip({ label, children, side = 'top', align = 'end', className = '' }: Props) {
  const position = `${side === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} ${align === 'end' ? 'right-0' : 'left-0'}`
  return (
    <span className={`group/tooltip relative inline-flex ${className}`}>
      {children}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute z-20 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity delay-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 dark:bg-slate-100 dark:text-slate-900 ${position}`}
      >
        {label}
      </span>
    </span>
  )
}
