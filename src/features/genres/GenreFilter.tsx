import { FunnelIcon, FunnelXIcon } from '@phosphor-icons/react'
import { Card } from '../../components/ui/Card'
import { ToggleChip } from '../../components/ui/Chip'
import { FILTER_VALUES, type GenreFilterValue, groupState, OTHER_GENRES, umbrellaState } from '../../domain/genreFilter'
import { GENRE_GROUPS } from '../../domain/genres'
import { useGenreFilter } from './useGenreFilter'
import { useI18n } from '../../i18n/useI18n'
import { GroupToggle } from './GroupToggle'
import { MemberChip } from './MemberChip'
import { genreLabel } from './genreLabel'
import type { ReactNode } from 'react'

// Todos os gêneros aparecem sempre, com ou sem eventos no período carregado.
const GROUPED = new Set<GenreFilterValue>(GENRE_GROUPS.flatMap(({ umbrella, genres }) => [umbrella, ...genres]))
/** Estilos fora dos conjuntos, e "Outros" por último. */
const STANDALONE = FILTER_VALUES.filter((value) => !GROUPED.has(value))

/**
 * Painel "Filtros": os conjuntos (Latinas, Afro, BR), cada um com seus gêneros, e depois os
 * estilos avulsos e "Outros". Todos sempre visíveis. Marcar um conjunto filtra o grupo todo; desmarcar parte dos estilos deixa o conjunto intermediário.
 */
export function GenreFilter({ plain = false }: { plain?: boolean } = {}) {
  const { selected, toggle, toggleAll, clear } = useGenreFilter()
  const { t } = useI18n()

  return (
    // "plain": sem o card (dentro do drawer, que já tem fundo e bordas).
    <Container plain={plain}>
      <div className="flex items-center gap-2">
        <FunnelIcon className="size-5 text-fg-muted" aria-hidden="true" />
        <h2 id="genre-filter-title" className="flex-1 text-sm font-semibold">
          {t.filters.title}
          {selected.length > 0 && <span className="font-normal text-fg-muted"> · {t.filters.active(selected.length)}</span>}
        </h2>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="-my-2 -mr-2 inline-flex h-11 cursor-pointer items-center gap-1 rounded-lg px-3 text-sm font-medium text-brand hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
          >
            <FunnelXIcon className="size-4" aria-hidden="true" />
            {t.filters.clear}
          </button>
        )}
      </div>

      {/* Blocos: título do bloco (chip do conjunto) + linha, e os gêneros embaixo.
          Em painel largo (tablet), 2 colunas; na sidebar e no celular, 1 (container query). */}
      <div role="group" aria-label={t.filters.genres} className="@container">
        <div className="grid gap-x-6 gap-y-3 @md:grid-cols-2">
          {GENRE_GROUPS.map(({ umbrella, genres: members }) => (
            <div key={umbrella} role="group" aria-label={t.filters.set(umbrella)} className="space-y-2">
              <div className="flex items-center gap-2">
                <GroupToggle
                  genre={umbrella}
                  pressed={umbrellaState(umbrella, selected)}
                  onClick={() => toggle(umbrella)}
                  title={t.filters.allOfSet(umbrella)}
                />
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
              </div>
              <div className="flex flex-wrap gap-2">
                {members.map((genre) => (
                  <MemberChip key={genre} genre={genre} selected={selected} onToggle={toggle} />
                ))}
              </div>
            </div>
          ))}

          {/* Estilos fora dos conjuntos e "Outros". */}
          <div role="group" aria-labelledby="genre-filter-others" className="space-y-2">
            <div className="flex h-8 items-center gap-2">
              <GroupToggle
                id="genre-filter-others"
                label={t.filters.otherStyles}
                pressed={groupState(STANDALONE, selected)}
                onClick={() => toggleAll(STANDALONE)}
                title={t.filters.allOfSet(t.filters.otherStyles)}
              />
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
            </div>
            <div className="flex flex-wrap gap-2">
              {STANDALONE.map((value) => (
                <ToggleChip
                  key={value}
                  // "Outros" usa o chip neutro, como os eventos sem gênero da lista.
                  {...(value === OTHER_GENRES ? { label: genreLabel(value, t) } : { genre: value })}
                  pressed={selected.includes(value)}
                  onClick={() => toggle(value)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}

function Container({ plain, children }: { plain: boolean; children: ReactNode }) {
  return plain ? (
    <section aria-labelledby="genre-filter-title" className="space-y-2">
      {children}
    </section>
  ) : (
    <Card variant="panel" as="section" aria-labelledby="genre-filter-title" className="space-y-2">
      {children}
    </Card>
  )
}
