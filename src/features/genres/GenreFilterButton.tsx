import { Funnel } from 'lucide-react'
import { useI18n } from '../../i18n/useI18n'

type Props = {
  open: boolean
  onToggle: () => void
  /** id do painel de filtros que o botão abre/fecha. */
  controls: string
  /** Quantos gêneros estão marcados (aparece como contador). */
  activeCount: number
}

/** Abre e fecha a seção de filtros. Mostra quantos gêneros estão ativos. */
export function GenreFilterButton({ open, onToggle, controls, activeCount }: Props) {
  const { t } = useI18n()
  const label = t.filters.button(activeCount)

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      aria-label={label}
      title={label}
      onClick={onToggle}
      className={`relative inline-flex h-14 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        open ? 'border-brand bg-brand text-brand-fg' : 'border-border bg-surface text-fg hover:bg-surface-muted'
      }`}
    >
      <Funnel className="size-6" aria-hidden="true" />
      {activeCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 inline-flex size-5 items-center justify-center rounded-full bg-genre-red text-xs font-semibold text-genre-red-fg tabular-nums"
        >
          {activeCount}
        </span>
      )}
    </button>
  )
}
