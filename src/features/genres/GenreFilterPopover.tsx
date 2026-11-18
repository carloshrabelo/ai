import { X } from 'lucide-react'
import { Fragment, useEffect, useRef } from 'react'
import { ToggleChip } from '../../components/ui/Chip'
import { FILTER_VALUES, type GenreFilterValue, OTHER_GENRES } from '../../domain/genreFilter'
import { GENRE_GROUPS } from '../../domain/genres'
import { useI18n } from '../../i18n/useI18n'
import { genreLabel } from './genreLabel'
import { useGenreFilter } from './useGenreFilter'

const GROUPED = new Set<GenreFilterValue>(GENRE_GROUPS.flatMap(({ umbrella, genres }) => [umbrella, ...genres]))
/** Estilos fora dos conjuntos, e "Outros" por último. */
const STANDALONE = FILTER_VALUES.filter((value) => !GROUPED.has(value))

const Divider = () => <span aria-hidden="true" className="h-6 w-px shrink-0 bg-border" />

type Props = {
  /** id do painel (o mesmo do aria-controls do botão de filtros). */
  id: string
  onClose: () => void
}

/**
 * Filtros no computador (a partir de `xl`): popover logo abaixo da faixa de dias, aberto pelo mesmo
 * botão do celular. Os estilos vêm em sequência, quebrando em linhas: cada conjunto (Latinas, Afro,
 * BR) com seus gêneros, separados por um traço, e depois os avulsos e "Outros". Fecha com Esc, com
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
      className="absolute top-full right-6 left-8 z-20 mt-2 space-y-3 rounded-xl border border-border bg-surface p-4 shadow-lg"
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
            <X className="size-4" aria-hidden="true" />
            {t.filters.clear}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={t.filters.done}
          title={t.filters.done}
          className="-my-2 -mr-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-brand"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div role="group" aria-label={t.filters.genres} className="flex flex-wrap items-center gap-2">
        {GENRE_GROUPS.map(({ umbrella, genres: members }, index) => (
          <Fragment key={umbrella}>
            {index > 0 && <Divider />}
            <span role="group" aria-label={t.filters.set(umbrella)} className="flex flex-wrap items-center gap-2">
              <ToggleChip
                genre={umbrella}
                variant="group"
                pressed={selected.includes(umbrella)}
                onClick={() => toggle(umbrella)}
                title={t.filters.allOfSet(umbrella)}
              />
              {members.map((genre) => (
                <ToggleChip key={genre} genre={genre} pressed={selected.includes(genre)} onClick={() => toggle(genre)} />
              ))}
            </span>
          </Fragment>
        ))}
        <Divider />
        <span role="group" aria-label={t.filters.otherStyles} className="flex flex-wrap items-center gap-2">
          {STANDALONE.map((value) => (
            <ToggleChip
              key={value}
              // "Outros" usa o chip neutro, como os eventos sem gênero da lista.
              {...(value === OTHER_GENRES ? { label: genreLabel(value, t) } : { genre: value })}
              pressed={selected.includes(value)}
              onClick={() => toggle(value)}
            />
          ))}
        </span>
      </div>
    </section>
  )
}
