import { useMemo } from 'react'
import { Link } from 'react-router'
import { Card } from '../../components/ui/Card'
import promoters from '../../data/promoters.json'
import { lisbonDate } from '../../data/dates'
import type { DanceEvent } from '../../domain/event'
import type { PromoterDirectory } from '../../domain/promoterDirectory'
import { extractPromoters } from '../../domain/promoters'
import { formatDayHeading, formatTimeRange } from '../../features/events/format'
import { eventPath } from '../../features/events/useSelectedEvent'
import { siteUrl, useDocumentHead } from '../../seo/useDocumentHead'
import { BackToTest, RangeFields } from './shared'
import { useEventsInRange } from './useEventsInRange'

/** Grafia errada → perfil certo, a partir dos `aliases` de promoters.json. */
const CORRECT_OF = new Map(
  Object.entries(promoters as unknown as PromoterDirectory).flatMap(([handle, entry]) =>
    (entry.aliases ?? []).map((alias) => [alias, handle] as const),
  ),
)

type Row = { event: DanceEvent; summary: string; fixes: { wrong: string; right: string }[] }

const TH = 'px-4 py-2 font-medium'
const TD = 'px-4 py-2 align-top'
const LINK = 'font-medium text-brand hover:underline'

/**
 * Página de teste (/teste/aliases, só com VITE_TEST_PAGES=true): eventos do período que citam uma
 * grafia errada de perfil (os `aliases` de src/data/promoters.json), com a grafia certa e o link do
 * evento no Google Agenda, para corrigir a descrição lá.
 */
export default function AliasReview() {
  useDocumentHead({ title: 'Revisão de aliases (teste)', description: 'Eventos com perfis escritos errado', canonical: `${siteUrl()}teste/aliases`, noindex: true })
  const { query, ...range } = useEventsInRange()

  const rows = useMemo<Row[]>(
    () =>
      (query.data ?? []).flatMap((event) => {
        const fixes = extractPromoters(event.description)
          .mentions.filter((mention) => CORRECT_OF.has(mention.handle))
          .map((mention) => ({ wrong: mention.handle, right: CORRECT_OF.get(mention.handle) ?? '' }))
        return fixes.length > 0 ? [{ event, summary: [event.rawTag, event.title].filter(Boolean).join(' • '), fixes }] : []
      }),
    [query.data],
  )
  const byAlias = [...CORRECT_OF].map(([wrong, right]) => ({
    wrong,
    right,
    count: rows.filter((row) => row.fixes.some((fix) => fix.wrong === wrong)).length,
  }))

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <BackToTest />
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Revisão de aliases</h2>
        <p className="text-sm text-fg-muted">
          Eventos que citam um perfil com a grafia errada (os <code className="rounded bg-surface-muted px-1">aliases</code> de
          promoters.json). Abra o evento no Google Agenda e troque pela grafia certa.
        </p>
        <RangeFields {...range} />
        <p className="text-sm text-fg-muted">
          {query.isPending
            ? 'Carregando eventos…'
            : query.isError
              ? `Erro: ${query.error.message}`
              : `${query.data.length} eventos · ${rows.length} com grafia errada · ${CORRECT_OF.size} aliases`}
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {byAlias.map(({ wrong, right, count }) => (
            <li key={wrong}>
              <s className="text-fg-muted">@{wrong}</s> → <span className="font-medium">@{right}</span>{' '}
              <span className="text-fg-muted">({query.data ? count : '…'})</span>
            </li>
          ))}
        </ul>
      </Card>

      {rows.length > 0 && (
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
                  Corrigir
                </th>
                <th scope="col" className={TH}>
                  Links
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ event, summary, fixes }) => (
                <tr key={event.id} className="border-b border-border last:border-0">
                  <td className={`${TD} whitespace-nowrap tabular-nums`}>
                    {formatDayHeading(lisbonDate(event.start), 'pt-BR')}
                    <span className="block text-fg-muted">{formatTimeRange(event, 'pt-BR')}</span>
                  </td>
                  <td className={`${TD} break-words`}>{summary}</td>
                  <td className={TD}>
                    {fixes.map(({ wrong, right }) => (
                      <span key={wrong} className="block whitespace-nowrap">
                        <s className="text-fg-muted">@{wrong}</s> → <span className="font-medium">@{right}</span>
                      </span>
                    ))}
                  </td>
                  <td className={`${TD} whitespace-nowrap`}>
                    <a href={event.calendarUrl} target="_blank" rel="noreferrer" className={LINK}>
                      Google Agenda
                    </a>
                    {' · '}
                    <Link to={eventPath(event.slug)} className={LINK}>
                      App
                    </Link>
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
