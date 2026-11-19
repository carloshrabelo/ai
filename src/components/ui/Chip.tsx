import type { ButtonHTMLAttributes } from 'react'
import { GENRE_EMOJI, type Genre } from '../../domain/genres'
import { genreColorClasses } from './genreColors'

const BASE = 'inline-flex shrink-0 items-center px-3 text-xs whitespace-nowrap'

// Profundidade "3D" dos botões do Duolingo: a base da tag mais escura, no tom da própria cor (sombra
// interna, não uma sombra cinza embaixo). O texto sobe 3px para ficar no centro da parte de cima.
const DEPTH = 'pb-[3px] shadow-[inset_0_-3px_0_rgb(0_0_0/0.22)]'
// Tag sem cor (filtro não marcado): a base na cor da borda.
const DEPTH_NEUTRAL = 'pb-[3px] shadow-[inset_0_-3px_0_var(--border)]'
// Ao apertar, afunda como os botões.
const PRESS = 'active:translate-y-px active:pb-0 active:shadow-none'

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
    <span className={`${BASE} ${genre ? DEPTH : DEPTH_NEUTRAL} h-7 rounded-xl font-bold ${colorOf(genre)}`}>
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
  const shape = variant === 'group' ? 'rounded-lg font-extrabold tracking-wide' : 'rounded-xl font-bold'
  // Selecionada, a borda fica transparente (e não some): as duas têm o mesmo tamanho.
  const state = pressed
    ? `border border-transparent ${colorOf(genre)} ${genre ? DEPTH : DEPTH_NEUTRAL}`
    : `border border-border bg-surface text-fg-muted hover:text-fg ${DEPTH_NEUTRAL}`
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`${BASE} h-8 cursor-pointer transition disabled:cursor-not-allowed ${PRESS} disabled:active:translate-y-0 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${shape} ${state} ${className}`}
      {...props}
    >
      <ChipLabel genre={genre} label={label} />
    </button>
  )
}
