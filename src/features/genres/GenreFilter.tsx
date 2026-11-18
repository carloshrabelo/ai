import { ChevronDown, Funnel, X } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { ToggleChip } from '../../components/ui/Chip'
import { FILTER_VALUES, type GenreFilterValue, OTHER_GENRES } from '../../domain/genreFilter'
import { GENRE_GROUPS } from '../../domain/genres'
import { LocationControl } from '../location/LocationControl'
import { useGenreFilter } from './useGenreFilter'
import { useI18n } from '../../i18n/useI18n'
import { genreLabel } from './genreLabel'
import { type ReactNode, useId, useState } from 'react'

// Todos os gêneros aparecem sempre, com ou sem eventos no período carregado.
const GROUPED = new Set<GenreFilterValue>(GENRE_GROUPS.flatMap(({ umbrella, genres }) => [umbrella, ...genres]))
/** Estilos fora dos conjuntos, e "Outros" por último. */
const STANDALONE = FILTER_VALUES.filter((value) => !GROUPED.has(value))

/** Aberto/fechado do acordeon da sidebar, lembrado no aparelho (sem storage: começa fechado). */
const OPEN_KEY = 'lisbon-social-dance:filters-open'

function loadOpen(): boolean {
  try {
    return window.localStorage.getItem(OPEN_KEY) === 'true'
  } catch {
    return false
  }
}

function saveOpen(open: boolean) {
  try {
    window.localStorage.setItem(OPEN_KEY, String(open))
  } catch {
    // sem storage
  }
}

/**
 * Painel "Filtros": os conjuntos (Latinas, Afro, BR), cada um com seus gêneros, e depois os
 * estilos avulsos e "Outros". Marcar um conjunto filtra o grupo todo. Na sidebar (sem `plain`) é um
 * acordeon, fechado por padrão, para não ocupar a coluna: fechado, mostra só quantos estão ativos.
 */
export function GenreFilter({ plain = false }: { plain?: boolean } = {}) {
  const { selected, toggle, clear } = useGenreFilter()
  const { t } = useI18n()
  const bodyId = useId()
  const [stored, setStored] = useState(loadOpen)
  const open = plain || stored
  const toggleOpen = () => {
    setStored(!stored)
    saveOpen(!stored)
  }

  const title = (
    <>
      {t.filters.title}
      {selected.length > 0 && <span className="font-normal text-fg-muted"> · {t.filters.active(selected.length)}</span>}
    </>
  )

  return (
    // "plain": sem o card (dentro do drawer, que já tem fundo e bordas).
    <Container plain={plain}>
      <div className="flex items-center gap-2">
        {plain ? (
          <>
            <Funnel className="size-5 text-fg-muted" aria-hidden="true" />
            <h2 id="genre-filter-title" className="flex-1 text-sm font-semibold">
              {title}
            </h2>
          </>
        ) : (
          <h2 id="genre-filter-title" className="flex-1 text-sm font-semibold">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={bodyId}
              onClick={toggleOpen}
              className="-my-2 -ml-2 flex h-11 w-[calc(100%+0.5rem)] cursor-pointer items-center gap-2 rounded-lg px-2 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Funnel className="size-5 shrink-0 text-fg-muted" aria-hidden="true" />
              <span className="flex flex-1 items-center gap-2">
                {t.filters.title}
                {/* Quantos ativos num badge, como no botão de filtro do celular. */}
                {selected.length > 0 && (
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-genre-red text-xs font-semibold text-genre-red-fg tabular-nums">
                    <span aria-hidden="true">{selected.length}</span>
                    <span className="sr-only">{t.filters.active(selected.length)}</span>
                  </span>
                )}
              </span>
              <ChevronDown className={`size-5 shrink-0 text-fg-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </h2>
        )}
        {/* Na sidebar, "Limpar" fica dentro do painel aberto. */}
        {plain && selected.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="-my-2 -mr-2 inline-flex h-11 cursor-pointer items-center gap-1 rounded-lg px-3 text-sm font-medium text-brand hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
          >
            <X className="size-4" aria-hidden="true" />
            {t.filters.clear}
          </button>
        )}
      </div>

      {open && (
        <div id={bodyId} className="space-y-2">
          {!plain && selected.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="-my-1 -ml-2 inline-flex h-11 cursor-pointer items-center gap-1 rounded-lg px-2 text-sm font-medium text-brand hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
            >
              <X className="size-4" aria-hidden="true" />
              {t.filters.clear}
            </button>
          )}
          {/* Blocos: título do bloco (chip do conjunto) + linha, e os gêneros embaixo.
              Em painel largo (tablet), 2 colunas; na sidebar e no celular, 1 (container query). */}
          <div role="group" aria-label={t.filters.genres} className="@container">
            <div className="grid gap-x-6 gap-y-3 @md:grid-cols-2">
              {GENRE_GROUPS.map(({ umbrella, genres: members }) => (
                <div key={umbrella} role="group" aria-label={t.filters.set(umbrella)} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ToggleChip
                      genre={umbrella}
                      variant="group"
                      pressed={selected.includes(umbrella)}
                      onClick={() => toggle(umbrella)}
                      title={t.filters.allOfSet(umbrella)}
                    />
                    <span aria-hidden="true" className="h-px flex-1 bg-border" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {members.map((genre) => (
                      <ToggleChip key={genre} genre={genre} pressed={selected.includes(genre)} onClick={() => toggle(genre)} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Estilos fora dos conjuntos e "Outros". */}
              <div role="group" aria-labelledby="genre-filter-others" className="space-y-2">
                <div className="flex h-8 items-center gap-2">
                  <span id="genre-filter-others" className="px-1 text-xs font-semibold tracking-wide text-fg-muted">
                    {t.filters.otherStyles}
                  </span>
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

          <div className="border-t border-border pt-4">
            <LocationControl />
          </div>
        </div>
      )}
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
