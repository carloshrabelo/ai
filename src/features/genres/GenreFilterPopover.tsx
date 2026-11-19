import { FunnelXIcon, XIcon } from '@phosphor-icons/react'
import { type ReactNode, useEffect, useRef } from 'react'
import { ToggleChip } from '../../components/ui/Chip'
import { FILTER_VALUES, type GenreFilterValue, OTHER_GENRES } from '../../domain/genreFilter'
import { type Genre, GENRE_GROUPS } from '../../domain/genres'
import { useI18n } from '../../i18n/useI18n'
import { GroupToggle } from './GroupToggle'
import { genreLabel } from './genreLabel'
import { useGenreFilter } from './useGenreFilter'

const GROUPED = new Set<GenreFilterValue>(GENRE_GROUPS.flatMap(({ umbrella, genres }) => [umbrella, ...genres]))
/** Estilos fora dos conjuntos, e "Outros" por último. */
const STANDALONE = FILTER_VALUES.filter((value) => !GROUPED.has(value))

/** Título da coluna (chip do conjunto ou "Outros estilos") com uma linha até o fim. */
function ColumnHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {children}
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  )
}

type Props = {
  /** id do painel (o mesmo do aria-controls do botão de filtros). */
  id: string
  onClose: () => void
}

/**
 * Filtros no computador (a partir de `xl`): popover logo abaixo da faixa de dias, aberto pelo mesmo
 * botão do celular. Os estilos em 4 colunas: cada conjunto (Latinas, Afro, BR) com seus gêneros, e
 * os avulsos com "Outros". Fecha com Esc, com
 * clique fora ou no botão. Fica em `top-full` do pai posicionado (a área fixa da agenda), alinhado ao conteúdo dela.
 */
export function GenreFilterPopover({ id, onClose }: Props) {
  const { selected, toggle, clear } = useGenreFilter()
  const { t } = useI18n()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const toggleButton = () => document.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(id)}"]`)
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      onClose()
      toggleButton()?.focus()
    }
    // Clique fora fecha; o botão de filtros tem o próprio toggle.
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (ref.current?.contains(target) || toggleButton()?.contains(target)) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [id, onClose])

  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={`${id}-title`}
      className="absolute top-full right-6 left-8 z-20 mt-2 space-y-3 rounded-2xl border-2 border-b-4 border-border bg-surface p-4 shadow-lg"
    >
      <div className="flex items-center gap-2">
        <h2 id={`${id}-title`} className="flex-1 text-sm font-semibold">
          {t.filters.title}
          {selected.length > 0 && <span className="font-normal text-fg-muted"> · {t.filters.active(selected.length)}</span>}
        </h2>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="-my-2 inline-flex h-11 cursor-pointer items-center gap-1 rounded-lg px-3 text-sm font-medium text-brand hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
          >
            <FunnelXIcon className="size-4" aria-hidden="true" />
            {t.filters.clear}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={t.filters.close}
          title={t.filters.close}
          className="-my-2 -mr-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-brand"
        >
          <XIcon className="size-5" aria-hidden="true" />
        </button>
      </div>

      {/* 4 colunas: os conjuntos (Latinas, Afro, BR), cada um com seus gêneros, e os estilos avulsos.
          Com o popover estreito (tela de 1280px, "West Coast Swing" não cabe na coluna), 2 × 2. */}
      <div role="group" aria-label={t.filters.genres} className="@container">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 @2xl:grid-cols-4">
          {GENRE_GROUPS.map(({ umbrella, genres: members }) => (
            <div key={umbrella} role="group" aria-label={t.filters.set(umbrella)} className="min-w-0 space-y-3">
              <ColumnHeader>
                <GroupToggle
                  genre={umbrella}
                  pressed={selected.includes(umbrella)}
                  onClick={() => toggle(umbrella)}
                  title={t.filters.allOfSet(umbrella)}
                />
              </ColumnHeader>
              <div className="flex flex-wrap gap-2">
                {members.map((genre) => (
                  <MemberChip key={genre} genre={genre} umbrella={umbrella} selected={selected} onToggle={toggle} />
                ))}
              </div>
            </div>
          ))}
          <div role="group" aria-labelledby={`${id}-others`} className="min-w-0 space-y-3">
            <ColumnHeader>
              <span id={`${id}-others`} className="flex h-8 items-center px-1 text-xs font-semibold tracking-wide text-fg-muted">
                {t.filters.otherStyles}
              </span>
            </ColumnHeader>
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
    </section>
  )
}

/**
 * Estilo de um conjunto. Com o conjunto marcado, aparece marcado e bloqueado ("Incluído em Latinas"):
 * o conjunto já traz o grupo todo.
 */
function MemberChip({
  genre,
  umbrella,
  selected,
  onToggle,
}: {
  genre: Genre
  umbrella: Genre
  selected: readonly GenreFilterValue[]
  onToggle: (genre: GenreFilterValue) => void
}) {
  const { t } = useI18n()
  const locked = selected.includes(umbrella)
  return (
    <ToggleChip
      genre={genre}
      pressed={locked || selected.includes(genre)}
      disabled={locked}
      title={locked ? t.filters.includedIn(umbrella) : undefined}
      onClick={() => onToggle(genre)}
    />
  )
}
