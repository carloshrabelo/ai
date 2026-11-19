import { addDays, type IsoDate } from '../../lib/dates'
import type { DanceEventsPage } from '../../api/queries'
import { type GenreFilterValue, matchesGenres } from '../../domain/genreFilter'

/** Quantas janelas seguidas sem resultado o filtro busca sozinho antes de pausar. */
const MAX_FILTERED_MISSES = 3

/**
 * Janelas seguidas, do fim para o começo, sem nenhum evento que passe no filtro.
 * Só conta a partir de `fromPage` (onde o usuário pediu "buscar mais" pela última vez).
 */
export function trailingMisses(pages: readonly DanceEventsPage[], genres: readonly GenreFilterValue[], fromPage = 0): number {
  let misses = 0
  for (let i = pages.length - 1; i >= fromPage; i--) {
    if (pages[i].events.some((event) => matchesGenres(event.genres, genres))) break
    misses++
  }
  return misses
}

/** Com filtro ativo, pausa a busca automática depois de MAX_FILTERED_MISSES janelas sem resultado. */
export function shouldPauseFilteredSearch(pages: readonly DanceEventsPage[], genres: readonly GenreFilterValue[], fromPage = 0): boolean {
  return genres.length > 0 && trailingMisses(pages, genres, fromPage) >= MAX_FILTERED_MISSES
}

/** Último dia já buscado (o fim da janela é exclusivo). */
export function lastSearchedDay(pages: readonly DanceEventsPage[], startDate: IsoDate): IsoDate {
  const end = pages.at(-1)?.end
  return end ? addDays(end, -1) : startDate
}
