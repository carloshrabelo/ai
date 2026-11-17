import type { ButtonHTMLAttributes } from 'react'
import type { Genre } from '../../domain/genres'
import { genreColorClasses } from './genreColors'

const BASE = 'inline-flex shrink-0 items-center rounded-full px-3 text-xs font-medium whitespace-nowrap'

type ChipProps = {
  /** Gênero conhecido (usa a cor da paleta) ou texto livre (chip neutro). */
  genre?: Genre
  label?: string
}

const colorOf = genreColorClasses

/** Chip só de leitura, 28px de altura. */
export function Chip({ genre, label }: ChipProps) {
  return <span className={`${BASE} h-7 ${colorOf(genre)}`}>{label ?? genre}</span>
}

type ToggleChipProps = ChipProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
    pressed: boolean
  }

/** Chip selecionável do filtro, 32px de altura. Não selecionado fica neutro com borda. */
export function ToggleChip({ genre, label, pressed, className = '', ...props }: ToggleChipProps) {
  const state = pressed
    ? colorOf(genre)
    : 'border border-border bg-surface text-fg-muted hover:text-fg'
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`${BASE} h-8 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${state} ${className}`}
      {...props}
    >
      {label ?? genre}
    </button>
  )
}
