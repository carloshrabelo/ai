import type { FieldIssue } from './review'

/** Um erro: o trecho em volta, a palavra errada e a correção escolhida (ou "não corrigir"). */
export function IssueRow({
  issue,
  text,
  value,
  onChange,
  onIgnore,
}: {
  issue: FieldIssue
  text: string
  value: string | null
  onChange: (value: string | null) => void
  onIgnore?: () => void
}) {
  const before = text
    .slice(Math.max(0, issue.offset - 40), issue.offset)
    .replace(/^\S*\s/, '…')
    .replaceAll('\n', ' ')
  const after = text
    .slice(issue.offset + issue.length, issue.offset + issue.length + 40)
    .replace(/\s\S*$/, '…')
    .replaceAll('\n', ' ')
  const prefix = issue.kind === 'alias' ? '@' : ''
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="rounded bg-surface-muted px-1.5 text-xs text-fg-muted">
        {issue.kind === 'alias' ? 'perfil' : 'ortografia'}
        {issue.field === 'title' ? ' · título' : ''}
      </span>
      <span className="min-w-0 break-words">
        <span className="text-fg-muted">{before}</span>
        <s className="text-red-600 dark:text-red-400">{issue.word}</s>
        <span className="text-fg-muted">{after}</span>
      </span>
      <span aria-hidden="true">→</span>
      {issue.suggestions.length > 1 || issue.kind === 'spelling' ? (
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          aria-label={`Correção de ${issue.word}`}
          className="h-9 rounded-lg border border-border bg-surface px-2 font-medium"
        >
          {issue.suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion}>
              {prefix}
              {suggestion}
            </option>
          ))}
          <option value="">Não corrigir</option>
        </select>
      ) : (
        <span className="font-medium">
          {prefix}
          {value}
        </span>
      )}
      {onIgnore && (
        <button type="button" onClick={onIgnore} className="cursor-pointer text-xs text-fg-muted hover:underline">
          Ignorar “{issue.word}” sempre
        </button>
      )}
    </li>
  )
}
