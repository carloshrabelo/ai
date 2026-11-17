import { useInfiniteQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X } from 'lucide-react'
import { useMemo } from 'react'
import { Card } from '../../components/ui/Card'
import { ToggleChip } from '../../components/ui/Chip'
import { Skeleton } from '../../components/ui/Skeleton'
import type { IsoDate } from '../../data/dates'
import { eventsInfiniteQueryOptions, flattenEvents } from '../../data/queries'
import { GENRES } from '../../domain/genres'
import { useGenreFilter } from './useGenreFilter'

// Classes literais para o Tailwind gerar.
const SKELETON_WIDTHS = ['w-16', 'w-20', 'w-14', 'w-18', 'w-12', 'w-16']

/**
 * Painel "Filtros": um chip por gênero presente nos eventos carregados (mais os já marcados,
 * para poder desmarcar) e o botão "Limpar".
 */
export function GenreFilter({ startDate }: { startDate: IsoDate }) {
  const { selected, toggle, clear } = useGenreFilter()
  // Só lê o cache da mesma query do feed.
  const { data, isPending } = useInfiniteQuery(eventsInfiniteQueryOptions(startDate))

  const available = useMemo(() => {
    const present = new Set(flattenEvents(data?.pages ?? []).flatMap((event) => event.genres))
    return GENRES.filter((genre) => present.has(genre) || selected.includes(genre))
  }, [data, selected])

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
        <div role="group" aria-label="Gêneros" className="flex flex-wrap gap-2">
          {available.map((genre) => (
            <ToggleChip key={genre} genre={genre} pressed={selected.includes(genre)} onClick={() => toggle(genre)} />
          ))}
        </div>
      )}
    </Card>
  )
}
