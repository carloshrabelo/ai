import type { ButtonHTMLAttributes } from 'react'
import { type Genre, type GenreColor, genreToPalette } from '../../domain/genres'

/** Classes literais para o Tailwind encontrar no build. */
const COLOR_CLASSES: Record<GenreColor | 'neutral', string> = {
  neutral: 'bg-genre-neutral text-genre-neutral-fg',
  wine: 'bg-genre-wine text-genre-wine-fg',
  pink: 'bg-genre-pink text-genre-pink-fg',
  brown: 'bg-genre-brown text-genre-brown-fg',
  'dark-blue': 'bg-genre-dark-blue text-genre-dark-blue-fg',
  red: 'bg-genre-red text-genre-red-fg',
  yellow: 'bg-genre-yellow text-genre-yellow-fg',
  'dark-green': 'bg-genre-dark-green text-genre-dark-green-fg',
  'light-blue': 'bg-genre-light-blue text-genre-light-blue-fg',
  orange: 'bg-genre-orange text-genre-orange-fg',
  purple: 'bg-genre-purple text-genre-purple-fg',
  teal: 'bg-genre-teal text-genre-teal-fg',
}

const BASE = 'inline-flex shrink-0 items-center rounded-full px-3 text-xs font-medium whitespace-nowrap'

type ChipProps = {
  /** Gênero conhecido (usa a cor da paleta) ou texto livre (chip neutro). */
  genre?: Genre
  label?: string
}

function colorOf(genre?: Genre) {
  return COLOR_CLASSES[genre ? genreToPalette[genre] : 'neutral']
}

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
