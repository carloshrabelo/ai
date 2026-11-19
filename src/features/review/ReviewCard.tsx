import { Check, Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { eventPath } from '../events/useSelectedEvent'
import { IssueRow } from './IssueRow'
import { corrected, type FieldIssue, type Reviewed, type ValueOf, when } from './review'

const LINK = 'font-medium text-brand hover:underline'

/** Copia o texto; com `html`, também em HTML (cola com a formatação no Google Agenda). */
async function copy(text: string, html?: string) {
  if (html) {
    const richHtml = /<[a-z][^>]*>/i.test(html) ? html : html.replaceAll('\n', '<br>')
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([richHtml], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ])
      return
    } catch {
      // sem suporte a HTML: só o texto
    }
  }
  await navigator.clipboard.writeText(text)
}

type Props = Reviewed & {
  valueOf: ValueOf
  onChoose: (issue: FieldIssue, value: string | null) => void
  onIgnore: (word: string) => void
}

/** Um grupo de eventos com erros: datas (links do Google Agenda), cada erro e o texto corrigido. */
export function ReviewCard({ group, issues, valueOf, onChoose, onIgnore }: Props) {
  const [copied, setCopied] = useState<'title' | 'description' | null>(null)
  const fixed = corrected(group, issues, valueOf)
  const [first] = group.events

  const copyField = async (field: 'title' | 'description') => {
    const value = fixed[field]
    if (!value) return
    await copy(value.text, field === 'description' ? value.html : undefined)
    setCopied(field)
    setTimeout(() => setCopied((current) => (current === field ? null : current)), 2000)
  }
  const icon = (field: 'title' | 'description') =>
    copied === field ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />

  return (
    <Card className="space-y-3">
      <div className="space-y-1">
        <h3 className="font-semibold">
          <Link to={eventPath(first.slug)} className="hover:underline">
            {first.title}
          </Link>
        </h3>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {group.events.map((event) => (
            <li key={event.id}>
              <a
                href={event.calendarUrl}
                target="_blank"
                rel="noreferrer"
                className={`${LINK} inline-flex items-center gap-1 tabular-nums`}
              >
                {when(event)}
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        {group.events.length > 1 && (
          <p className="text-xs text-fg-muted">Links do Google Agenda. Se for um evento recorrente, corrija em “este e os seguintes”.</p>
        )}
      </div>

      <ul className="space-y-2 text-sm">
        {issues.map((issue) => (
          <IssueRow
            key={issue.id}
            issue={issue}
            text={group.texts.find((text) => text.field === issue.field)?.plain.text ?? ''}
            value={valueOf(issue)}
            onChange={(value) => onChoose(issue, value)}
            onIgnore={issue.kind === 'spelling' ? () => onIgnore(issue.word) : undefined}
          />
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        {fixed.title?.changed && (
          <Button variant="secondary" onClick={() => copyField('title')}>
            {icon('title')}
            Copiar título corrigido
          </Button>
        )}
        {fixed.description?.changed && (
          <Button variant="secondary" onClick={() => copyField('description')}>
            {icon('description')}
            Copiar descrição corrigida
          </Button>
        )}
      </div>
      {fixed.description?.changed && (
        <details className="text-sm">
          <summary className="cursor-pointer text-fg-muted">Ver descrição corrigida</summary>
          <p className="mt-2 rounded-lg bg-surface-muted p-3 whitespace-pre-line">{fixed.description.text}</p>
        </details>
      )}
    </Card>
  )
}
