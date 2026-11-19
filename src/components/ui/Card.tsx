import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'section' | 'div'
  /** Painel flutuante (filtros, popup do mapa): cantos maiores e sombra mais forte. */
  variant?: 'card' | 'panel'
}

const VARIANTS = {
  card: 'rounded-xl shadow-sm',
  panel: 'rounded-2xl shadow-md',
}

/** Superfície padrão: p-4, sombra no claro, borda sutil e sem sombra no escuro. */
export function Card({ as: Tag = 'div', variant = 'card', className = '', ...props }: CardProps) {
  return <Tag className={`bg-surface p-4 dark:border dark:border-border dark:shadow-none ${VARIANTS[variant]} ${className}`} {...props} />
}
