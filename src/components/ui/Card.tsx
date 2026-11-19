import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'section' | 'div'
  /** Painel flutuante (filtros, popup do mapa): cantos maiores e sombra mais forte. */
  variant?: 'card' | 'panel'
}

// Estilo Duolingo: borda de 2px, um pouco mais grossa embaixo, cantos bem arredondados, sem sombra.
const VARIANTS = {
  card: 'rounded-2xl border-2 border-b-4 border-border',
  // Painel flutuante (popup do mapa, popover): a única sombra do tema, suave, porque fica sobre o conteúdo.
  panel: 'rounded-2xl border-2 border-b-4 border-border shadow-md',
}

/** Superfície padrão: p-4, sombra no claro, borda sutil e sem sombra no escuro. */
export function Card({ as: Tag = 'div', variant = 'card', className = '', ...props }: CardProps) {
  return <Tag className={`bg-surface p-4 ${VARIANTS[variant]} ${className}`} {...props} />
}
