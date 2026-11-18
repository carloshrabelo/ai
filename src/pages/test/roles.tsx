import { type Role, ROLES } from '../../domain/promoters'
import { ROLE_LABEL, type RoleFilter } from './roleLabels'

/** Filtro por papel (promotor, DJ, professor…), com a contagem de cada um. */
export function RoleSelect({ value, onChange, counts }: { value: RoleFilter; onChange: (value: RoleFilter) => void; counts: Record<Role, number> }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as RoleFilter)}
      aria-label="Papel"
      className="h-11 rounded-lg border border-border bg-surface px-3 text-sm"
    >
      {ROLES.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABEL[role]} ({counts[role]})
        </option>
      ))}
      <option value="all">Todos</option>
    </select>
  )
}

/** Etiqueta pequena com o papel. */
export function RoleTag({ role }: { role: Role }) {
  return <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs font-medium text-fg-muted">{ROLE_LABEL[role]}</span>
}
