import type { ButtonHTMLAttributes, ReactNode } from 'react'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const VARIANTS = {
  primary: 'bg-brand text-brand-fg hover:opacity-90',
  secondary: 'border border-border bg-surface text-fg hover:bg-surface-muted',
  ghost: 'text-fg-muted hover:bg-surface-muted hover:text-fg',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS
}

/** Botão com texto: 44px de altura, rounded-lg. */
export function Button({ variant = 'primary', type = 'button', className = '', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition disabled:cursor-default disabled:opacity-60 ${FOCUS} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Texto para leitor de tela (o botão só mostra o ícone). */
  label: string
  icon: ReactNode
  variant?: keyof typeof VARIANTS
}

/** Botão só com ícone: área de toque de 44 × 44px. */
export function IconButton({ label, icon, variant = 'ghost', type = 'button', className = '', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg transition ${FOCUS} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  )
}
