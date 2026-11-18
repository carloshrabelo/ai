import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Card } from '../../components/ui/Card'
import { lisbonDate } from '../../data/dates'
import type { DanceEvent } from '../../domain/event'
import { formatDayHeading, formatTimeRange } from '../../features/events/format'
import { eventPath } from '../../features/events/useSelectedEvent'
import { siteUrl, useDocumentHead } from '../../seo/useDocumentHead'
import { BackToTest, RangeFields } from './shared'
import { useEventsInRange } from './useEventsInRange'

type Row = { event: DanceEvent; summary: string; hint?: string }

// Trecho da descrição que cita valor ("Entrada 5€", "€10", "10 euros"): o preço pode estar lá.
const PRICE_IN_TEXT = /[^.\n]{0,40}(?:\d+(?:[.,]\d+)?\s*(?:€|euros?\b)|€\s*\d+)[^.\n]{0,40}/i

function descriptionText(html: string | undefined): string {
  if (!html) return ''
  return new DOMParser().parseFromString(html.replace(/<br\s*\/?>/gi, '\n'), 'text/html').body.textContent ?? ''
}

/**
 * Página de teste (/teste/sem-preco, só com VITE_TEST_PAGES=true): eventos do período sem preço no
 * título, com o título como está no calendário e, quando houver, o trecho da descrição que cita
 * valor. Ajuda a decidir o que corrigir no calendário ou no parser (src/domain/parseSummary.ts).
 */
export default function NoPrice() {
  useDocumentHead({ title: 'Sem preço (teste)', description: 'Eventos sem preço', canonical: `${siteUrl()}teste/sem-preco`, noindex: true })
  const { query, ...range } = useEventsInRange()
  const [onlyWithHint, setOnlyWithHint] = useState(false)

  const rows = useMemo<Row[]>(
    () =>
      (query.data ?? [])
        .filter((event) => !event.price)
        .map((event) => {
          // Título reconstruído no formato do calendário (`Tag • Nome`).
          const summary = [event.rawTag, event.title].filter(Boolean).join(' • ')
          const hint = descriptionText(event.description).match(PRICE_IN_TEXT)?.[0].trim()
          return { event, summary, ...(hint ? { hint } : {}) }
        }),
    [query.data],
  )
  const withHint = rows.filter((row) => row.hint).length
  const visible = onlyWithHint ? rows.filter((row) => row.hint) : rows

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <BackToTest />
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Eventos sem preço</h2>
        <RangeFields {...range} />
        <p className="text-sm text-fg-muted">
          {query.isPending
            ? 'Carregando eventos…'
            : query.isError
              ? `Erro: ${query.error.message}`
              : `${query.data.length} eventos · ${rows.length} sem preço · ${withHint} com valor na descrição`}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyWithHint} onChange={(e) => setOnlyWithHint(e.target.checked)} className="size-4" />
          Só os que citam valor na descrição
        </label>
      </Card>

      {visible.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-fg-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  Quando
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Título no calendário
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Valor na descrição
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Links
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ event, summary, hint }) => (
                <tr key={event.id} className="border-b border-border align-top last:border-0">
                  <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                    {formatDayHeading(lisbonDate(event.start), 'pt-BR')}
                    <span className="block text-fg-muted">{formatTimeRange(event, 'pt-BR')}</span>
                  </td>
                  <td className="px-4 py-2 break-words">
                    {summary}
                    {event.status && <span className="ml-2 text-xs text-fg-muted">({event.status})</span>}
                  </td>
                  <td className="px-4 py-2 break-words text-fg-muted">{hint ?? '—'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Link to={eventPath(event.slug)} className="font-medium text-brand hover:underline">
                      App
                    </Link>
                    {' · '}
                    <a href={event.calendarUrl} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
                      Calendário
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  )
}
