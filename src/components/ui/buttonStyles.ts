// Estilos dos botões, separados de Button.tsx (fast refresh: arquivo de componentes só exporta componentes).

export const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

/**
 * Botão de ferramenta (calendário e filtro, ao lado da faixa de dias): o formato dos cards, borda de
 * 2px e base de 4px, que afunda ao apertar. Aberto/ativo, roxo com a base num roxo mais escuro.
 */
export const TOOL = 'rounded-2xl border-2 border-b-4 transition active:translate-y-0.5 active:border-b-2'
export const TOOL_IDLE = 'border-border bg-surface text-fg hover:bg-surface-muted'
export const TOOL_ACTIVE = 'border-brand border-b-[var(--brand-shadow)] bg-brand text-brand-fg'

// Botões "3D" do Duolingo: borda de 2px e sombra sólida embaixo que some ao apertar (o botão afunda).
// O principal pode ser colorido, mas também tem borda (no tom da base).
const PRESS = 'active:translate-y-1 active:shadow-none'
export const VARIANTS = {
  primary: `border-2 border-[var(--brand-shadow)] bg-brand text-brand-fg shadow-[0_4px_0_var(--brand-shadow)] hover:brightness-105 ${PRESS}`,
  secondary: `border-2 border-border bg-surface text-accent shadow-[0_4px_0_var(--border)] hover:bg-surface-muted ${PRESS}`,
  ghost: 'text-fg-muted hover:bg-surface-muted hover:text-fg',
  tool: `${TOOL} ${TOOL_IDLE}`,
}

/** Classes do botão com texto, também para links com cara de botão (ex.: Google Agenda). */
export function buttonClassName(variant: keyof typeof VARIANTS = 'primary', className = '') {
  return `inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold tracking-wide uppercase transition disabled:cursor-default disabled:opacity-60 ${FOCUS} ${VARIANTS[variant]} ${className}`
}

