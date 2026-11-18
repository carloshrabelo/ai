import { Funnel, X } from 'lucide-react'
import { Fragment } from 'react'
import { ToggleChip } from '../../components/ui/Chip'
import { FILTER_VALUES, type GenreFilterValue, OTHER_GENRES } from '../../domain/genreFilter'
import { GENRE_GROUPS } from '../../domain/genres'
import { useI18n } from '../../i18n/useI18n'
import { genreLabel } from './genreLabel'
import { useGenreFilter } from './useGenreFilter'

const GROUPED = new Set<GenreFilterValue>(GENRE_GROUPS.flatMap(({ umbrella, genres }) => [umbrella, ...genres]))
const STANDALONE = FILTER_VALUES.filter((value) => !GROUPED.has(value))

const Divider = () => <span aria-hidden="true" className="h-6 w-px shrink-0 bg-border" />

/**
 * Filtros numa barra horizontal, no topo da lista (teste de layout no computador, ver filterLayout.ts):
 * os conjuntos com seus gêneros em sequência, separados por um traço, e os estilos avulsos no fim.
 * `wrap`: quebra em mais linhas; sem ele, uma linha só com rolagem horizontal.
 */
export function GenreFilterBar({ wrap = false }: { wrap?: boolean }) {
  const { selected, toggle, clear } = useGenreFilter()
  const { t } = useI18n()
  const chip = 'shrink-0'

  return (
    <div role="group" aria-label={t.filters.title} className={`flex gap-2 ${wrap ? 'items-start' : 'items-center'}`}>
      <span className="relative inline-flex size-8 shrink-0 items-center justify-center text-fg-muted" title={t.filters.title}>
        <Funnel className="size-5" aria-hidden="true" />
        {selected.length > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex size-4 items-center justify-center rounded-full bg-genre-red text-[10px] font-semibold text-genre-red-fg tabular-nums">
            <span aria-hidden="true">{selected.length}</span>
            <span className="sr-only">{t.filters.active(selected.length)}</span>
          </span>
        )}
      </span>
      <div
        className={`flex min-w-0 flex-1 items-center gap-2 ${
          wrap ? 'flex-wrap' : '-my-1 overflow-x-auto py-1 [scrollbar-width:thin] [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] pr-8'
        }`}
      >
        {GENRE_GROUPS.map(({ umbrella, genres: members }, index) => (
          <Fragment key={umbrella}>
            {index > 0 && <Divider />}
            <span role="group" aria-label={t.filters.set(umbrella)} className={`flex items-center gap-2 ${wrap ? 'flex-wrap' : ''}`}>
              <ToggleChip
                genre={umbrella}
                variant="group"
                pressed={selected.includes(umbrella)}
                onClick={() => toggle(umbrella)}
                title={t.filters.allOfSet(umbrella)}
                className={chip}
              />
              {members.map((genre) => (
                <ToggleChip key={genre} genre={genre} pressed={selected.includes(genre)} onClick={() => toggle(genre)} className={chip} />
              ))}
            </span>
          </Fragment>
        ))}
        <Divider />
        {STANDALONE.map((value) => (
          <ToggleChip
            key={value}
            {...(value === OTHER_GENRES ? { label: genreLabel(value, t) } : { genre: value })}
            pressed={selected.includes(value)}
            onClick={() => toggle(value)}
            className={chip}
          />
        ))}
      </div>
      {selected.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className={`inline-flex h-11 shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 ${wrap ? '-mt-1.5' : ''} text-sm font-medium text-brand hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand`}
        >
          <X className="size-4" aria-hidden="true" />
          {t.filters.clear}
        </button>
      )}
    </div>
  )
}
