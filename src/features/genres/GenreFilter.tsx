import { useInfiniteQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X } from 'lucide-react'
import { useMemo } from 'react'
import { Card } from '../../components/ui/Card'
import { ToggleChip } from '../../components/ui/Chip'
import { Skeleton } from '../../components/ui/Skeleton'
import type { IsoDate } from '../../data/dates'
import { eventsInfiniteQueryOptions, flattenEvents } from '../../data/queries'
import { FILTER_VALUES, type GenreFilterValue, OTHER_GENRES } from '../../domain/genreFilter'
import { expandGenres, GENRE_GROUPS } from '../../domain/genres'
import { LocationControl } from '../location/LocationControl'
import { useGenreFilter } from './useGenreFilter'

// Classes literais para o Tailwind gerar.
const SKELETON_WIDTHS = ['w-16', 'w-20', 'w-14', 'w-18', 'w-12', 'w-16']

/**
 * Painel "Filtros": os conjuntos (Latinas, Afro, BR), cada um com seus gêneros, e depois os
 * estilos avulsos e "Outros". Só aparecem gêneros presentes nos eventos carregados (mais os já
 * marcados, para poder desmarcar). Marcar um conjunto filtra o grupo todo.
 */
export function GenreFilter({ startDate }: { startDate: IsoDate }) {
  const { selected, toggle, clear } = useGenreFilter()
  // Só lê o cache da mesma query do feed.
  const { data, isPending } = useInfiniteQuery(eventsInfiniteQueryOptions(startDate))

  const available = useMemo(() => {
    const events = flattenEvents(data?.pages ?? [])
    // Inclui os gêneros implícitos: evento "Latinas" faz aparecer também Salsa e Bachata.
    const present = new Set<GenreFilterValue>(events.flatMap((event) => [...expandGenres(event.genres)]))
    // "Outros": eventos cujo gênero não está na lista.
    if (events.some((event) => event.genres.length === 0)) present.add(OTHER_GENRES)
    return FILTER_VALUES.filter((value) => present.has(value) || selected.includes(value))
  }, [data, selected])

  // Conjuntos com algum gênero disponível; o resto vai para a linha dos estilos avulsos.
  const groups = GENRE_GROUPS.map(({ umbrella, genres }) => ({
    umbrella,
    members: genres.filter((genre) => available.includes(genre)),
  })).filter(({ umbrella, members }) => members.length > 0 || available.includes(umbrella))
  const grouped = new Set<GenreFilterValue>(GENRE_GROUPS.flatMap(({ umbrella, genres }) => [umbrella, ...genres]))
  const standalone = available.filter((value) => !grouped.has(value))

  return (
    <Card variant="panel" as="section" aria-labelledby="genre-filter-title" className="space-y-2">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-5 text-fg-muted" aria-hidden="true" />
        <h2 id="genre-filter-title" className="flex-1 text-sm font-semibold">
          Filtros
          {selected.length > 0 && <span className="font-normal text-fg-muted"> · {selected.length} ativo{selected.length > 1 ? 's' : ''}</span>}
        </h2>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="-my-2 -mr-2 inline-flex h-11 cursor-pointer items-center gap-1 rounded-lg px-3 text-sm font-medium text-brand hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
          >
            <X className="size-4" aria-hidden="true" />
            Limpar
          </button>
        )}
      </div>

      {isPending ? (
        <div aria-busy="true" className="flex flex-wrap gap-2">
          <span className="sr-only">Carregando gêneros…</span>
          {SKELETON_WIDTHS.map((width, i) => (
            <Skeleton key={i} rounded="rounded-full" className={`h-8 ${width}`} />
          ))}
        </div>
      ) : available.length === 0 ? (
        <p className="text-sm text-fg-muted">Nenhum gênero nos eventos carregados.</p>
      ) : (
        // Blocos: título do bloco (chip do conjunto) + linha, e os gêneros embaixo.
        // Em painel largo (tablet), 2 colunas; na sidebar e no celular, 1 (container query).
        <div role="group" aria-label="Gêneros" className="@container">
          <div className="grid gap-x-6 gap-y-3 @md:grid-cols-2">
            {groups.map(({ umbrella, members }) => (
              <div key={umbrella} role="group" aria-label={`Conjunto ${umbrella}`} className="space-y-2">
                <div className="flex items-center gap-2">
                  <ToggleChip
                    genre={umbrella}
                    variant="group"
                    pressed={selected.includes(umbrella)}
                    onClick={() => toggle(umbrella)}
                    title={`Todos de ${umbrella}`}
                  />
                  <span aria-hidden="true" className="h-px flex-1 bg-border" />
                </div>
                {members.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {members.map((genre) => (
                      <ToggleChip key={genre} genre={genre} pressed={selected.includes(genre)} onClick={() => toggle(genre)} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Estilos fora dos conjuntos e "Outros". */}
            {standalone.length > 0 && (
              <div role="group" aria-labelledby="genre-filter-others" className="space-y-2">
                <div className="flex h-8 items-center gap-2">
                  <span id="genre-filter-others" className="px-1 text-xs font-semibold tracking-wide text-fg-muted">
                    Outros estilos
                  </span>
                  <span aria-hidden="true" className="h-px flex-1 bg-border" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {standalone.map((value) => (
                    <ToggleChip
                      key={value}
                      // "Outros" usa o chip neutro, como os eventos sem gênero da lista.
                      {...(value === OTHER_GENRES ? { label: value } : { genre: value })}
                      pressed={selected.includes(value)}
                      onClick={() => toggle(value)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-border pt-4">
        <LocationControl />
      </div>
    </Card>
  )
}
