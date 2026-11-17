import { type GenreFilterValue, OTHER_GENRES } from '../../domain/genreFilter'
import type { Messages } from '../../i18n/messages'

/** Nome exibido de uma opção do filtro: gêneros são nomes próprios; só "Outros" é traduzido. */
export function genreLabel(value: GenreFilterValue, t: Messages): string {
  return value === OTHER_GENRES ? t.filters.other : value
}
