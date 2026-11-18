import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Card } from '../../components/ui/Card'
import { Segmented } from '../../components/ui/Segmented'
import { lisbonDate } from '../../data/dates'
import type { DanceEvent } from '../../domain/event'
import { visibleGenres } from '../../domain/genres'
import { type EventPromoters, extractPromoters } from '../../domain/promoters'
import { formatDayHeading, formatTimeRange } from '../../features/events/format'
import { eventPath } from '../../features/events/useSelectedEvent'
import { siteUrl, useDocumentHead } from '../../seo/useDocumentHead'
import { BackToTest, RangeFields } from './shared'
import { useEventsInRange } from './useEventsInRange'

type View = 'promoters' | 'events'
type EventRow = { event: DanceEvent; summary: string } & EventPromoters
type PromoterRow = { handle: string; events: DanceEvent[]; titles: number; genres: string[]; venues: string[] }

const TH = 'px-4 py-2 font-medium'
const TD = 'px-4 py-2 align-top'
const LINK = 'font-medium text-brand hover:underline'

const instagramUrl = (handle: string) => `https://www.instagram.com/${handle}/`

/** Os n mais frequentes de uma lista, do mais para o menos comum. */
function top(values: string[], n: number): string[] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, n).map(([value]) => value)
}

/**
 * Página de teste (/teste/promotores, só com VITE_TEST_PAGES=true): responsáveis por cada evento,
 * lidos da descrição (perfis do Instagram e "Organização: …", ver src/domain/promoters.ts).
 * Duas visões: por promotor (quantos eventos, estilos, locais) e por evento.
 */
export default function Promoters() {
  useDocumentHead({ title: 'Promotores (teste)', description: 'Responsáveis pelos eventos', canonical: `${siteUrl()}teste/promotores`, noindex: true })
  const { query, ...range } = useEventsInRange()
  const [view, setView] = useState<View>('promoters')
  const [search, setSearch] = useState('')
  const [onlyMissing, setOnlyMissing] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const eventRows = useMemo<EventRow[]>(
    () =>
      (query.data ?? []).map((event) => ({
        event,
        summary: [event.rawTag, event.title].filter(Boolean).join(' • '),
        ...extractPromoters(event.description),
      })),
    [query.data],
  )

  const promoterRows = useMemo<PromoterRow[]>(() => {
    const byHandle = new Map<string, DanceEvent[]>()
    for (const { event, handles } of eventRows) {
      for (const handle of handles) byHandle.set(handle, [...(byHandle.get(handle) ?? []), event])
    }
    return [...byHandle]
      .map(([handle, events]) => ({
        handle,
        events,
        titles: new Set(events.map((event) => event.title)).size,
        genres: top(events.flatMap((event) => visibleGenres(event.genres)), 3),
        venues: top(events.flatMap((event) => (event.venue ? [event.venue.name] : [])), 2),
      }))
      .sort((a, b) => b.events.length - a.events.length || a.handle.localeCompare(b.handle))
  }, [eventRows])

  const missing = eventRows.filter((row) => row.handles.length === 0 && !row.organizedBy).length
  const term = search.trim().toLowerCase()
  const matches = (...texts: (string | undefined)[]) => !term || texts.some((text) => text?.toLowerCase().includes(term))

  const visiblePromoters = promoterRows.filter((row) => matches(row.handle, ...row.events.map((event) => event.title)))
  const visibleEvents = eventRows.filter(
    (row) =>
      (!onlyMissing || (row.handles.length === 0 && !row.organizedBy)) && matches(row.summary, row.organizedBy, ...row.handles),
  )

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <BackToTest />
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Promotores</h2>
        <RangeFields {...range} />
        <p className="text-sm text-fg-muted">
          {query.isPending
            ? 'Carregando eventos…'
            : query.isError
              ? `Erro: ${query.error.message}`
              : `${eventRows.length} eventos · ${promoterRows.length} perfis · ${eventRows.length - missing} com responsável · ${missing} sem responsável`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Ver por"
            options={[
              { value: 'promoters', label: 'Promotores' },
              { value: 'events', label: 'Eventos' },
            ]}
            value={view}
            onChange={setView}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar perfil ou evento"
            aria-label="Buscar perfil ou evento"
            className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm"
          />
          {view === 'events' && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} className="size-4" />
              Só sem responsável
            </label>
          )}
        </div>
      </Card>

      {view === 'promoters' ? (
        visiblePromoters.length > 0 && (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-fg-muted">
                <tr>
                  <th scope="col" className={TH}>
                    Perfil
                  </th>
                  <th scope="col" className={`${TH} text-right`}>
                    Eventos
                  </th>
                  <th scope="col" className={TH}>
                    Estilos
                  </th>
                  <th scope="col" className={TH}>
                    Locais
                  </th>
                </tr>
              </thead>
              <tbody>
                {visiblePromoters.map((row) => {
                  const isOpen = expanded === row.handle
                  return (
                    <PromoterTableRow key={row.handle} row={row} isOpen={isOpen} onToggle={() => setExpanded(isOpen ? null : row.handle)} />
                  )
                })}
              </tbody>
            </table>
          </Card>
        )
      ) : (
        visibleEvents.length > 0 && (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-fg-muted">
                <tr>
                  <th scope="col" className={TH}>
                    Quando
                  </th>
                  <th scope="col" className={TH}>
                    Título no calendário
                  </th>
                  <th scope="col" className={TH}>
                    Responsáveis
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.map(({ event, summary, handles, organizedBy }) => (
                  <tr key={event.id} className="border-b border-border last:border-0">
                    <td className={`${TD} whitespace-nowrap tabular-nums`}>
                      {formatDayHeading(lisbonDate(event.start), 'pt-BR')}
                      <span className="block text-fg-muted">{formatTimeRange(event, 'pt-BR')}</span>
                    </td>
                    <td className={`${TD} break-words`}>
                      <Link to={eventPath(event.slug)} className={LINK}>
                        {summary}
                      </Link>
                    </td>
                    <td className={TD}>
                      {handles.length === 0 && !organizedBy ? (
                        <span className="text-fg-muted">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {handles.map((handle) => (
                            <a key={handle} href={instagramUrl(handle)} target="_blank" rel="noreferrer" className={LINK}>
                              @{handle}
                            </a>
                          ))}
                          {organizedBy && <span className="text-fg-muted">Organização: {organizedBy}</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      )}
    </section>
  )
}

/** Linha de um perfil; aberta, lista os eventos dele logo abaixo. */
function PromoterTableRow({ row, isOpen, onToggle }: { row: PromoterRow; isOpen: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className={`border-b border-border ${isOpen ? 'bg-brand/10' : 'hover:bg-surface-muted'}`}>
        <td className={TD}>
          <button type="button" aria-expanded={isOpen} onClick={onToggle} className="cursor-pointer text-left font-medium">
            {isOpen ? '▾' : '▸'} @{row.handle}
          </button>{' '}
          <a href={instagramUrl(row.handle)} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">
            Instagram
          </a>
        </td>
        <td className={`${TD} text-right tabular-nums`}>
          {row.events.length}
          {row.titles !== row.events.length && <span className="block text-xs text-fg-muted">{row.titles} títulos</span>}
        </td>
        <td className={`${TD} text-fg-muted`}>{row.genres.join(', ') || '—'}</td>
        <td className={`${TD} text-fg-muted`}>{row.venues.join(', ') || '—'}</td>
      </tr>
      {isOpen && (
        <tr className="border-b border-border bg-surface-muted/50">
          <td colSpan={4} className="px-4 py-2">
            <ul className="space-y-1">
              {row.events.map((event) => (
                <li key={event.id} className="flex flex-wrap gap-x-3">
                  <span className="tabular-nums text-fg-muted">{formatDayHeading(lisbonDate(event.start), 'pt-BR')}</span>
                  <Link to={eventPath(event.slug)} className={LINK}>
                    {event.title}
                  </Link>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  )
}
