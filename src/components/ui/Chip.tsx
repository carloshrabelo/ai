import type { ButtonHTMLAttributes } from 'react'
import { GENRE_EMOJI, type Genre } from '../../domain/genres'
import { genreColorClasses } from './genreColors'

const BASE = 'inline-flex shrink-0 items-center px-3 text-xs whitespace-nowrap'

type ChipProps = {
  /** Gênero conhecido (usa a cor da paleta) ou texto livre (chip neutro). */
  genre?: Genre
  label?: string
}

const colorOf = genreColorClasses

/** Texto do chip: bandeira do conjunto (decorativa) + nome. */
function ChipLabel({ genre, label }: ChipProps) {
  const emoji = genre ? GENRE_EMOJI[genre] : undefined
  return (
    <>
      {emoji && (
        <span aria-hidden="true" className="mr-1">
          {emoji}
        </span>
      )}
      {label ?? genre}
    </>
  )
}

/** Chip só de leitura, 28px de altura. */
export function Chip({ genre, label }: ChipProps) {
  return (
    <span className={`${BASE} h-7 rounded-full font-medium ${colorOf(genre)}`}>
      <ChipLabel genre={genre} label={label} />
    </span>
  )
}

type ToggleChipProps = ChipProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
    pressed: boolean
    /** "group": chip de conjunto (Latinas, Afro, BR): cantos retos e negrito. */
    variant?: 'genre' | 'group'
  }

/** Chip selecionável do filtro, 32px de altura. Não selecionado fica neutro com borda. */
export function ToggleChip({ genre, label, pressed, variant = 'genre', className = '', ...props }: ToggleChipProps) {
  const shape = variant === 'group' ? 'rounded-md font-semibold tracking-wide' : 'rounded-full font-medium'
  const state = pressed
    ? colorOf(genre)
    : 'border border-border bg-surface text-fg-muted hover:text-fg'
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`${BASE} h-8 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${shape} ${state} ${className}`}
      {...props}
    >
      <ChipLabel genre={genre} label={label} />
    </button>
  )
}
