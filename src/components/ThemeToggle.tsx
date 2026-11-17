import { type ThemeMode, useTheme } from '../theme/useTheme'

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
]

/** Seletor Claro / Escuro / Sistema. */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { mode, setMode } = useTheme()

  return (
    <div role="radiogroup" aria-label="Tema" className={`inline-flex rounded-lg bg-surface-muted p-0.5 ${className}`}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={mode === option.value}
          onClick={() => setMode(option.value)}
          className={`h-10 min-w-20 flex-1 cursor-pointer rounded-md px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-brand ${
            mode === option.value ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
