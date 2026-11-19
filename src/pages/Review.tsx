import { useQuery } from '@tanstack/react-query'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { lisbonDate } from '../data/dates'
import { checkSpelling, type SpellLanguage } from '../data/languageTool'
import promoters from '../data/promoters.json'
import venues from '../data/venues.json'
import type { DanceEvent } from '../domain/event'
import type { PromoterDirectory } from '../domain/promoterDirectory'
import {
  aliasIssues,
  applyFixes,
  type Fix,
  IGNORED_WORDS,
  type Issue,
  type PlainText,
  spellingIssues,
  toPlain,
  type ToolMatch,
} from '../domain/spelling'
import { formatShortDay, formatTimeRange } from '../features/events/format'
import { eventPath } from '../features/events/useSelectedEvent'
import { siteUrl, useDocumentHead } from '../seo/useDocumentHead'
import { RangeFields } from './test/shared'
import { useEventsInRange } from './test/useEventsInRange'

/** Grafia errada → perfil certo, a partir dos `aliases` de promoters.json. */
const CORRECT_OF = new Map(
  Object.entries(promoters as unknown as PromoterDirectory).flatMap(([handle, entry]) =>
    (entry.aliases ?? []).map((alias) => [alias.toLowerCase(), handle] as const),
  ),
)

/** Palavras dos nomes dos locais conhecidos ("Tropicavana Bar"): nomes próprios, não erros. */
const VENUE_WORDS = Object.values(venues as Record<string, { name: string }>).flatMap(({ name }) =>
  name
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter((word) => word.length > 2),
)

const LANGUAGES: SpellLanguage[] = ['pt-PT', 'pt-BR', 'en-US', 'es']
const IGNORE_KEY = 'lisbon-social-dance:review-ignored'
const CHECKS_KEY = 'lisbon-social-dance:review-checks'

/** O que verificar: ortografia (LanguageTool, mais lento) e perfis escritos errado. */
type Checks = { spelling: boolean; aliases: boolean }
const LINK = 'font-medium text-brand hover:underline'

type Field = 'title' | 'description'
type Text = { field: Field; source: string; plain: PlainText }
/** Eventos com o mesmo título e descrição (as repetições semanais): corrigir um corrige todos. */
type Group = { key: string; events: DanceEvent[]; texts: Text[] }
type FieldIssue = Issue & { id: string; field: Field }

// Preferências de quem revisa, salvas no aparelho (sem storage: valem só nesta visita).
function load(key: string): unknown {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // sem storage
  }
}

function loadIgnored(): string[] {
  const words = load(IGNORE_KEY)
  return Array.isArray(words) ? words.filter((word) => typeof word === 'string') : []
}

function loadChecks(): Checks {
  const saved = load(CHECKS_KEY) as Partial<Checks> | null
  return { spelling: saved?.spelling === true, aliases: saved?.aliases !== false }
}
const saveIgnored = (words: string[]) => save(IGNORE_KEY, words)

const when = (event: DanceEvent) => `${formatShortDay(lisbonDate(event.start), 'pt-BR')} ${formatTimeRange(event, 'pt-BR')}`

/**
 * Revisão do texto dos eventos (/review): erros de ortografia (LanguageTool) e perfis do Instagram
 * escritos errado (aliases de promoters.json), com o texto corrigido para copiar e o link de cada
 * evento no Google Agenda. Pública, mas sem link no app nem no sitemap.
 */
export default function Review() {
  useDocumentHead({ title: 'Revisão', description: 'Erros de texto nos eventos', canonical: `${siteUrl()}review/`, noindex: true })
  const { query, ...range } = useEventsInRange(90)
  const [ignored, setIgnored] = useState(loadIgnored)
  const [checks, setChecks] = useState(loadChecks)
  const toggle = (key: keyof Checks) => (on: boolean) => {
    const next = { ...checks, [key]: on }
    setChecks(next)
    save(CHECKS_KEY, next)
  }
  const [choices, setChoices] = useState<Record<string, string | null>>({})
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)

  const groups = useMemo<Group[]>(() => {
    const byText = new Map<string, Group>()
    for (const event of query.data ?? []) {
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
  }, [query.data])

  const allTexts = useMemo(() => [...new Set(groups.flatMap((group) => group.texts.map((text) => text.plain.text)))], [groups])
  const spelling = useQuery({
    queryKey: ['review-spelling', allTexts],
    queryFn: async ({ signal }) => {
      setProgress(0)
      // Respostas das línguas para cada texto, na ordem de LANGUAGES.
      const results = new Map<string, ToolMatch[][]>(allTexts.map((text) => [text, []]))
      for (const [i, language] of LANGUAGES.entries()) {
        const checked = await checkSpelling(allTexts, language, { signal, onProgress: (done) => setProgress(i * allTexts.length + done) })
        allTexts.forEach((text, j) => results.get(text)?.push(checked[j]))
      }
      return results
    },
    enabled: checks.spelling && allTexts.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })

  const ignoredSet = useMemo(() => new Set([...IGNORED_WORDS, ...VENUE_WORDS, ...ignored]), [ignored])
  const reviewed = useMemo(
    () =>
      groups
        .map((group) => {
          const issues: FieldIssue[] = group.texts.flatMap(({ field, plain }) => {
            const aliases = checks.aliases ? aliasIssues(plain.text, CORRECT_OF) : []
            const words = (checks.spelling ? spellingIssues(plain.text, spelling.data?.get(plain.text) ?? [], ignoredSet) : []).filter(
              (issue) => !aliases.some((alias) => issue.offset < alias.offset + alias.length && issue.offset + issue.length > alias.offset),
            )
            return [...aliases, ...words]
              .sort((a, b) => a.offset - b.offset)
              .map((issue) => ({ ...issue, field, id: `${group.key}|${field}|${issue.offset}` }))
          })
          return { group, issues }
        })
        .filter(({ issues }) => issues.length > 0),
    [groups, spelling.data, ignoredSet, checks],
  )

  const valueOf = (issue: FieldIssue) => (issue.id in choices ? choices[issue.id] : issue.suggestions[0])
  const corrected = (group: Group, issues: FieldIssue[]) =>
    Object.fromEntries(
      group.texts.map(({ field, source, plain }) => {
        const fixes: Fix[] = issues.flatMap((issue) => {
          const value = valueOf(issue)
          return issue.field === field && value != null ? [{ offset: issue.offset, length: issue.length, value }] : []
        })
        const fixed = applyFixes(source, plain, fixes)
        return [field, { html: fixed, text: toPlain(fixed).text, changed: fixes.length > 0 }]
      }),
    ) as Partial<Record<Field, { html: string; text: string; changed: boolean }>>

  const ignoreWord = (word: string) => {
    const next = [...new Set([...ignored, word.toLowerCase()])]
    setIgnored(next)
    saveIgnored(next)
  }

  const flash = (id: string) => {
    setCopied(id)
    setTimeout(() => setCopied((current) => (current === id ? null : current)), 2000)
  }

  /** Relatório de tudo: por evento, as correções, o link do Google Agenda e o texto corrigido. */
  const copyAll = async () => {
    const blocks = reviewed.map(({ group, issues }) => {
      const fixed = corrected(group, issues)
      const [first, ...rest] = group.events
      const lines = [
        `${when(first)} · ${first.title}${rest.length > 0 ? ` (repete: ${rest.map((event) => formatShortDay(lisbonDate(event.start), 'pt-BR')).join(', ')})` : ''}`,
        `Google Agenda: ${first.calendarUrl}`,
        `Corrigir: ${issues
          .filter((issue) => valueOf(issue) != null)
          .map((issue) => `${issue.kind === 'alias' ? '@' : ''}${issue.word} → ${issue.kind === 'alias' ? '@' : ''}${valueOf(issue)}`)
          .join('; ')}`,
      ]
      if (fixed.title?.changed) lines.push(`Título corrigido: ${fixed.title.text}`)
      if (fixed.description?.changed) lines.push('Descrição corrigida:', fixed.description.text)
      return lines.join('\n')
    })
    await navigator.clipboard.writeText(
      `Revisão da agenda (${range.from.split('-').reverse().join('/')} a ${range.to.split('-').reverse().join('/')}): ${reviewed.length} eventos com correções\n\n${blocks.join('\n\n---\n\n')}\n`,
    )
    flash('all')
  }

  /** Descrição corrigida de um evento, com a formatação (HTML) para colar no Google Agenda. */
  const copyDescription = async (id: string, html: string, text: string) => {
    const richHtml = /<[a-z][^>]*>/i.test(html) ? html : html.replaceAll('\n', '<br>')
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([richHtml], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ])
    } catch {
      await navigator.clipboard.writeText(text)
    }
    flash(id)
  }

  const total = allTexts.length * LANGUAGES.length
  const checkingSpelling = checks.spelling && spelling.isFetching
  // Skeleton enquanto os eventos chegam, e no fim da lista enquanto a ortografia ainda não voltou.
  const skeletons = query.isPending ? 3 : checkingSpelling ? 2 : 0
  const aliasCount = reviewed.filter(({ issues }) => issues.some((issue) => issue.kind === 'alias')).length

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Revisão do texto dos eventos</h2>
        <p className="text-sm text-fg-muted">
          Erros de ortografia (LanguageTool, em português de Portugal e do Brasil, inglês e espanhol: só conta a palavra que todos marcam) e
          perfis do Instagram escritos errado. Eventos que se repetem com o mesmo texto aparecem uma vez só.
        </p>
        <RangeFields {...range} />
        <p className="text-sm text-fg-muted" aria-live="polite">
          {query.isPending
            ? 'Carregando eventos…'
            : query.isError
              ? `Erro: ${query.error.message}`
              : [
                  `${query.data.length} eventos (${groups.length} textos diferentes)`,
                  !checks.spelling
                    ? null
                    : spelling.isError
                      ? `ortografia: erro (${spelling.error.message})`
                      : spelling.isFetching
                        ? 'verificando ortografia…'
                        : null,
                  `${reviewed.length} com correções (${aliasCount} com perfil errado)`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
        </p>
        {checkingSpelling && <SpellingProgress done={Math.min(progress, total)} total={total} />}
        <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <legend className="sr-only">Verificar</legend>
          <CheckField label="Perfis escritos errado (aliases)" checked={checks.aliases} onChange={toggle('aliases')} />
          <CheckField label="Ortografia (LanguageTool)" checked={checks.spelling} onChange={toggle('spelling')} />
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={copyAll} disabled={reviewed.length === 0}>
            {copied === 'all' ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied === 'all' ? 'Copiado' : 'Copiar tudo corrigido, com os links'}
          </Button>
          {ignored.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setIgnored([])
                saveIgnored([])
              }}
            >
              Voltar a mostrar {ignored.length} palavras ignoradas
            </Button>
          )}
        </div>
      </Card>

      {reviewed.map(({ group, issues }) => {
        const fixed = corrected(group, issues)
        const [first] = group.events
        return (
          <Card key={group.key} className="space-y-3">
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
                <p className="text-xs text-fg-muted">
                  Links do Google Agenda. Se for um evento recorrente, corrija em “este e os seguintes”.
                </p>
              )}
            </div>

            <ul className="space-y-2 text-sm">
              {issues.map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  text={group.texts.find((text) => text.field === issue.field)?.plain.text ?? ''}
                  value={valueOf(issue)}
                  onChange={(value) => setChoices((current) => ({ ...current, [issue.id]: value }))}
                  onIgnore={issue.kind === 'spelling' ? () => ignoreWord(issue.word) : undefined}
                />
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              {fixed.title?.changed && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(fixed.title?.text ?? '')
                    flash(`${group.key}|title`)
                  }}
                >
                  {copied === `${group.key}|title` ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                  Copiar título corrigido
                </Button>
              )}
              {fixed.description?.changed && (
                <Button
                  variant="secondary"
                  onClick={() => copyDescription(`${group.key}|description`, fixed.description?.html ?? '', fixed.description?.text ?? '')}
                >
                  {copied === `${group.key}|description` ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                  Copiar descrição corrigida
                </Button>
              )}
            </div>
            {fixed.description?.changed && (
              <details className="text-sm">
                <summary className="cursor-pointer text-fg-muted">Ver descrição corrigida</summary>
                <p className="mt-2 whitespace-pre-line rounded-lg bg-surface-muted p-3">{fixed.description.text}</p>
              </details>
            )}
          </Card>
        )
      })}
      {Array.from({ length: skeletons }, (_, index) => (
        <ReviewCardSkeleton key={index} />
      ))}
    </section>
  )
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4" />
      {label}
    </label>
  )
}

/** Barra de progresso da verificação de ortografia (textos × línguas já verificados). */
function SpellingProgress({ done, total }: { done: number; total: number }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-fg-muted">
        <span>Verificando ortografia (a API gratuita tem limite por minuto)</span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Verificando ortografia"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} de ${total}`}
        className="h-2 overflow-hidden rounded-full bg-surface-muted"
      >
        <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

/** Card de resultado carregando: mesmas medidas do card real (título, datas, erros, botão). */
function ReviewCardSkeleton() {
  return (
    <Card className="space-y-3" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-11 w-52" rounded="rounded-lg" />
    </Card>
  )
}

/** Um erro: o trecho em volta, a palavra errada e a correção escolhida (ou "não corrigir"). */
function IssueRow({
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
