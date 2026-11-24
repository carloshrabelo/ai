import { ToggleChip } from '../../components/ui/Chip'
import { coveringUmbrella, type GenreFilterValue } from '../../domain/genreFilter'
import type { Genre } from '../../domain/genres'
import { track } from '../../analytics/track'

/**
 * Estilo de um conjunto no filtro. Com o conjunto marcado, aparece marcado e continua clicável:
 * desmarcar tira o conjunto do filtro e deixa os outros estilos dele marcados (o conjunto fica
 * intermediário). Usado no painel (sidebar/folha) e no popover.
 */
export function MemberChip({
  genre,
  selected,
  onToggle,
}: {
  genre: Genre
  selected: readonly GenreFilterValue[]
  onToggle: (genre: GenreFilterValue) => void
}) {
  return (
    <ToggleChip
      {...track('filters.genre', genre)}
      genre={genre}
      pressed={!!coveringUmbrella(genre, selected) || selected.includes(genre)}
      onClick={() => onToggle(genre)}
    />
  )
}
