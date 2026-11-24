import promoters from '../../content/promoters.json'
import venues from '../../content/venues.json'
import { type CalendarSource, CALENDARS } from '../../domain/calendarSources'
import type { DanceEvent } from '../../domain/event'
import type { PromoterDirectory } from '../../domain/promoterDirectory'
import {
  aliasIssues,
  applyFixes,
  type Fix,
  type Issue,
  type PlainText,
  spellingIssues,
  toPlain,
  type ToolMatch,
} from '../../domain/spelling'
import { lisbonDate } from '../../lib/dates'
import { formatShortDay, formatTimeRange } from '../events/format'

// Regras da página de revisão (/review), sem React: agrupar os eventos pelo texto, achar os erros,
// aplicar as correções escolhidas e montar o relatório para copiar.

type Field = 'title' | 'description'
type Text = { field: Field; source: string; plain: PlainText }
/** Eventos com o mesmo título e descrição (as repetições semanais): corrigir um corrige todos. */
export type Group = { key: string; events: DanceEvent[]; texts: Text[] }
export type FieldIssue = Issue & { id: string; field: Field }
export type Reviewed = { group: Group; issues: FieldIssue[] }
/** Correção escolhida para cada erro (id → texto; null = não corrigir). */
export type ValueOf = (issue: FieldIssue) => string | null
type Corrected = Partial<Record<Field, { html: string; text: string; changed: boolean }>>

/** Grafia errada → perfil certo, a partir dos `aliases` de promoters.json. */
const CORRECT_OF = new Map(
  Object.entries(promoters as unknown as PromoterDirectory).flatMap(([handle, entry]) =>
    (entry.aliases ?? []).map((alias) => [alias.toLowerCase(), handle] as const),
  ),
)

/** Palavras dos nomes dos locais conhecidos ("Tropicavana Bar"): nomes próprios, não erros. */
export const VENUE_WORDS = Object.values(venues as Record<string, { name: string }>).flatMap(({ name }) =>
  name
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter((word) => word.length > 2),
)

/** Eventos dos calendários marcados, agrupados pelo texto (título + descrição). */
export function groupEvents(events: readonly DanceEvent[], sources: readonly CalendarSource[]): Group[] {
  const byText = new Map<string, Group>()
  for (const event of events) {
    if (!sources.includes(event.source)) continue
    const key = `${event.title}\u0000${event.description ?? ''}`
    const group = byText.get(key)
    if (group) group.events.push(event)
    else {
      const texts: Text[] = [{ field: 'title', source: event.title, plain: toPlain(event.title) }]
      if (event.description) texts.push({ field: 'description', source: event.description, plain: toPlain(event.description) })
      byText.set(key, { key, events: [event], texts })
    }
  }
  return [...byText.values()]
}

/** Nome comparável: sem maiúsculas, acentos e pontuação ("Noite  Dominicana!" = "noite dominicana"). */
const sameName = (title: string) =>
  title
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

/**
 * Eventos com o mesmo nome no mesmo dia (Lisboa): quase sempre o mesmo evento cadastrado duas vezes
 * (ex.: um às 19:00 e outro às 07:00 por engano). Entra o grupo que tem algum evento dos calendários
 * marcados; os outros calendários entram juntos (o mesmo evento em dois calendários também conta).
 * Cancelados e adiados ficam de fora: o novo no mesmo dia costuma ser a remarcação.
 */
export function findDuplicates(events: readonly DanceEvent[], sources: readonly CalendarSource[]): DanceEvent[][] {
  const byDayAndName = new Map<string, DanceEvent[]>()
  for (const event of events) {
    if (event.status) continue
    const key = `${lisbonDate(event.start)}\u0000${sameName(event.title)}`
    byDayAndName.set(key, [...(byDayAndName.get(key) ?? []), event])
  }
  return [...byDayAndName.values()].filter((same) => same.length > 1 && same.some((event) => sources.includes(event.source)))
}

type FindOptions = {
  aliases: boolean
  /** Respostas do LanguageTool por texto (uma lista por língua); sem ortografia, undefined. */
  spelling?: ReadonlyMap<string, ToolMatch[][]>
  ignored: ReadonlySet<string>
}

/** Erros de cada grupo (perfis escritos errado e ortografia), só dos grupos que têm algum. */
export function findIssues(groups: readonly Group[], { aliases: withAliases, spelling, ignored }: FindOptions): Reviewed[] {
  return groups
    .map((group) => {
      const issues: FieldIssue[] = group.texts.flatMap(({ field, plain }) => {
        const aliases = withAliases ? aliasIssues(plain.text, CORRECT_OF) : []
        // Erro de ortografia dentro de um perfil errado já sai com a correção do perfil.
        const words = (spelling ? spellingIssues(plain.text, spelling.get(plain.text) ?? [], ignored) : []).filter(
          (issue) => !aliases.some((alias) => issue.offset < alias.offset + alias.length && issue.offset + issue.length > alias.offset),
        )
        return [...aliases, ...words]
          .sort((a, b) => a.offset - b.offset)
          .map((issue) => ({ ...issue, field, id: `${group.key}|${field}|${issue.offset}` }))
      })
      return { group, issues }
    })
    .filter(({ issues }) => issues.length > 0)
}

/** Título e descrição do grupo com as correções escolhidas (HTML original e texto). */
export function corrected(group: Group, issues: readonly FieldIssue[], valueOf: ValueOf): Corrected {
  return Object.fromEntries(
    group.texts.map(({ field, source, plain }) => {
      const fixes: Fix[] = issues.flatMap((issue) => {
        const value = valueOf(issue)
        return issue.field === field && value != null ? [{ offset: issue.offset, length: issue.length, value }] : []
      })
      const fixed = applyFixes(source, plain, fixes)
      return [field, { html: fixed, text: toPlain(fixed).text, changed: fixes.length > 0 }]
    }),
  ) as Corrected
}

/** "Sex, 20/11 21:00 – 23:59" */
export const when = (event: DanceEvent) => `${formatShortDay(lisbonDate(event.start), 'pt-BR')} ${formatTimeRange(event, 'pt-BR')}`

const day = (iso: string) => iso.split('-').reverse().join('/')

/** Relatório de tudo: os repetidos e, por evento, as correções, o link do Google Agenda e o texto corrigido. */
export function buildReport(
  reviewed: readonly Reviewed[],
  valueOf: ValueOf,
  {
    calendars,
    from,
    to,
    duplicates = [],
  }: { calendars: readonly string[]; from: string; to: string; duplicates?: readonly DanceEvent[][] },
): string {
  const repeated = duplicates.map((same) =>
    [
      `Repetido no mesmo dia: ${same[0].title} (apagar o que estiver errado)`,
      ...same.map((event) => `- ${when(event)} · ${CALENDARS[event.source].label}: ${event.calendarUrl}`),
    ].join('\n'),
  )
  const blocks = reviewed.map(({ group, issues }) => {
    const fixed = corrected(group, issues, valueOf)
    const [first, ...rest] = group.events
    const repeats = rest.length > 0 ? ` (repete: ${rest.map((event) => formatShortDay(lisbonDate(event.start), 'pt-BR')).join(', ')})` : ''
    const at = (issue: FieldIssue) => (issue.kind === 'alias' ? '@' : '')
    const lines = [
      `${when(first)} · ${first.title}${repeats}`,
      `Google Agenda: ${first.calendarUrl}`,
      `Corrigir: ${issues
        .filter((issue) => valueOf(issue) != null)
        .map((issue) => `${at(issue)}${issue.word} → ${at(issue)}${valueOf(issue)}`)
        .join('; ')}`,
    ]
    if (fixed.title?.changed) lines.push(`Título corrigido: ${fixed.title.text}`)
    if (fixed.description?.changed) lines.push('Descrição corrigida:', fixed.description.text)
    return lines.join('\n')
  })
  const counts = [duplicates.length > 0 ? `${duplicates.length} repetidos` : null, `${reviewed.length} eventos com correções`]
  return `Revisão da agenda: ${calendars.join(', ')} (${day(from)} a ${day(to)}): ${counts.filter(Boolean).join(', ')}\n\n${[...repeated, ...blocks].join('\n\n---\n\n')}\n`
}
