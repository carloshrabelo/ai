import { CheckIcon, MinusIcon } from '@phosphor-icons/react'
import { GENRE_EMOJI, type Genre } from '../../domain/genres'

type Props = {
  /** Conjunto (Latinas, Afro, BR): nome e bandeira vêm do gênero. */
  genre?: Genre
  /** Ou um rótulo livre (ex.: "Outros estilos"). */
  label?: string
  /** `mixed`: só parte do grupo está marcada. */
  pressed: boolean | 'mixed'
  onClick: () => void
  title?: string
  id?: string
}

/**
 * Título clicável de uma seção do filtro, com caixa de seleção: marca o grupo todo. Diferente dos
 * chips de estilo logo abaixo, que são as opções do grupo.
 */
export function GroupToggle({ genre, label, pressed, onClick, title, id }: Props) {
  const emoji = genre ? GENRE_EMOJI[genre] : undefined
  const checked = pressed === true
  return (
    <button
      id={id}
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
        {checked && <CheckIcon weight="bold" className="size-3.5" />}
        {pressed === 'mixed' && <MinusIcon weight="bold" className="size-3.5" />}
      </span>
      {emoji && <span aria-hidden="true">{emoji}</span>}
      {label ?? genre}
    </button>
  )
}
