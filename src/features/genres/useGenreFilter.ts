import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  GENRES_PARAM,
  type GenreFilterValue,
  genresToParam,
  parseGenresParam,
  toggleFilter,
  toSearchString,
} from '../../domain/genreFilter'

/**
 * Filtro de gêneros na URL (?genres=salsa,zouk). Acumulativo: cada gênero marcado soma ao filtro
 * e um evento aparece se tiver qualquer um deles.
 */
export function useGenreFilter() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()

  const selected = useMemo(() => parseGenresParam(new URLSearchParams(search).get(GENRES_PARAM)), [search])

  const update = useCallback(
    (genres: GenreFilterValue[]) => {
      const params = new URLSearchParams(search)
      const value = genresToParam(genres)
      if (value) params.set(GENRES_PARAM, value)
      else params.delete(GENRES_PARAM)
      // Filtro não cria entrada no histórico nem rola a página.
      navigate({ pathname, search: toSearchString(params) }, { replace: true, preventScrollReset: true })
    },
    [navigate, pathname, search],
  )

  const toggle = useCallback(
    (genre: GenreFilterValue) => update(toggleFilter(selected, genre)),
    [selected, update],
  )

  const clear = useCallback(() => {
    update([])
  }, [update])

  return { selected, toggle, clear }
}
