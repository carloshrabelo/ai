import type { ReactNode } from 'react'
import { track, type TrackId } from '../../analytics/track'

type Option<T extends string> = { value: T; label: string; lang?: string; /** Ícone decorativo antes do texto. */ icon?: ReactNode }

type Props<T extends string> = {
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  /** Nome para analytics (data-track); o valor de cada opção vai em data-track-value. */
  trackId?: TrackId
  className?: string
}

/** Grupo de opções exclusivas (radiogroup) em forma de botões lado a lado, na moldura do tema; a opção marcada fica roxa. */
export function Segmented<T extends string>({ label, options, value, onChange, className = '', trackId }: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex gap-1 rounded-2xl border-2 border-b-4 border-border bg-surface p-1 ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          {...(trackId && track(trackId, option.value))}
          lang={option.lang}
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`inline-flex h-10 min-w-20 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-brand ${
            value === option.value ? 'bg-brand text-brand-fg' : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  )
}
