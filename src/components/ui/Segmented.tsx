type Option<T extends string> = { value: T; label: string; lang?: string }

type Props<T extends string> = {
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** Grupo de opções exclusivas (radiogroup) em forma de botões lado a lado. */
export function Segmented<T extends string>({ label, options, value, onChange, className = '' }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex rounded-lg bg-surface-muted p-0.5 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          lang={option.lang}
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`h-10 min-w-20 flex-1 cursor-pointer rounded-md px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-brand ${
            value === option.value ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
