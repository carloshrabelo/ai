import { X } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { IconButton } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { lisbonDate } from '../../../lib/dates'
import type { DanceEvent } from '../../../domain/event'
import { EventDetails } from '../../../features/events/EventDetails'
import { formatDayHeading, formatTimeRange } from '../../../features/events/format'
import { eventPath } from '../../../features/events/useSelectedEvent'
import { siteUrl, useDocumentHead } from '../../../seo/useDocumentHead'
import { RangeFields } from '../../../features/range/RangeFields'
import { BackToTest } from '../shared'
import { useEventsInRange } from '../../../features/range/useEventsInRange'

type Row = { event: DanceEvent; summary: string; hint?: string }

// Trecho da descrição que cita valor ("Entrada 5€", "€10", "10 euros"): o preço pode estar lá.
const PRICE_IN_TEXT = /[^.\n]{0,40}(?:\d+(?:[.,]\d+)?\s*(?:€|euros?\b)|€\s*\d+)[^.\n]{0,40}/i

function descriptionText(html: string | undefined): string {
  if (!html) return ''
  return new DOMParser().parseFromString(html.replace(/<br\s*\/?>/gi, '\n'), 'text/html').body.textContent ?? ''
}

/**
 * Página de teste (/test/no-price, pública mas sem link no app): eventos do período sem preço no
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = rows.find((row) => row.event.id === selectedId)

  return (
    <div className="flex items-start gap-6">
      <section className="min-w-0 flex-1 space-y-4">
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
                </tr>
              </thead>
              <tbody>
                {visible.map(({ event, summary, hint }) => {
                  const isSelected = event.id === selectedId
                  return (
                    <tr
                      key={event.id}
                      className={`relative border-b border-border align-top last:border-0 ${isSelected ? 'bg-brand/10' : 'hover:bg-surface-muted'}`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                        {formatDayHeading(lisbonDate(event.start), 'pt-BR')}
                        <span className="block text-fg-muted">{formatTimeRange(event, 'pt-BR')}</span>
                      </td>
                      <td className="px-4 py-2 break-words">
                        {/* A linha inteira abre os detalhes (o botão se estica sobre ela). */}
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedId(isSelected ? null : event.id)}
                          className="cursor-pointer text-left font-medium outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-brand"
                        >
                          {summary}
                        </button>
                        {event.status && <span className="ml-2 text-xs text-fg-muted">({event.status})</span>}
                      </td>
                      <td className="px-4 py-2 break-words text-fg-muted">{hint ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        )}
      </section>
      <DetailsAside row={selected} onClose={() => setSelectedId(null)} />
    </div>
  )
}

/**
 * Detalhes do evento escolhido na tabela: coluna lateral fixa a partir de `lg` (com um aviso quando
 * nada está escolhido) e painel por cima da tela abaixo disso.
 */
function DetailsAside({ row, onClose }: { row?: Row; onClose: () => void }) {
  const headingId = useId()

  useEffect(() => {
    if (!row) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [row, onClose])

  if (!row) {
    return (
      <aside className="sticky top-4 hidden w-[26rem] shrink-0 lg:block">
        <Card className="text-center text-sm text-fg-muted">Escolha um evento na tabela para ver os detalhes.</Card>
      </aside>
    )
  }

  const { event, summary, hint } = row
  return (
    <aside
      aria-labelledby={headingId}
      className="fixed inset-0 z-30 overflow-y-auto bg-bg p-4 lg:sticky lg:top-4 lg:z-auto lg:max-h-[calc(100dvh-2rem)] lg:w-[26rem] lg:shrink-0 lg:rounded-xl lg:p-0"
    >
      <Card className="space-y-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1 space-y-1 text-sm">
            <p className="text-fg-muted">Título no calendário</p>
            <p className="font-medium break-words">{summary}</p>
            {hint && (
              <p>
                <span className="text-fg-muted">Valor na descrição: </span>
                {hint}
              </p>
            )}
            <p>
              <Link to={eventPath(event.slug)} className="font-medium text-brand hover:underline">
                Abrir no app
              </Link>
              {' · '}
              <a href={event.calendarUrl} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
                Google Agenda
              </a>
            </p>
          </div>
          <IconButton label="Fechar detalhes" icon={<X className="size-5" aria-hidden="true" />} onClick={onClose} />
        </div>
        <hr className="border-border" />
        <EventDetails key={event.id} event={event} headingId={headingId} />
      </Card>
    </aside>
  )
}
