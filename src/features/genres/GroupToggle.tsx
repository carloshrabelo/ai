import { CheckIcon } from '@phosphor-icons/react'
import { GENRE_EMOJI, type Genre } from '../../domain/genres'

type Props = {
  genre: Genre
  pressed: boolean
  onClick: () => void
  title?: string
}

/**
 * Conjunto (Latinas, Afro, BR) como título clicável da seção, com caixa de seleção: diferente dos
 * chips de estilo logo abaixo, que são as opções do conjunto.
 */
export function GroupToggle({ genre, pressed, onClick, title }: Props) {
  const emoji = GENRE_EMOJI[genre]
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      title={title}
      className="-mx-1 inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-1 text-sm font-extrabold tracking-wide whitespace-nowrap uppercase hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span
        aria-hidden="true"
        className={`inline-flex size-5 items-center justify-center rounded-md border-2 ${pressed ? 'border-brand bg-brand text-brand-fg' : 'border-border bg-surface'}`}
      >
        {pressed && <CheckIcon weight="bold" className="size-3.5" />}
      </span>
      {emoji && <span aria-hidden="true">{emoji}</span>}
      {genre}
    </button>
  )
}
