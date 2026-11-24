import { CheckIcon, CopyIcon } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CALENDAR_SOURCES, CALENDARS, type CalendarSource } from '../domain/calendarSources'
import { IGNORED_WORDS } from '../domain/spelling'
import { RangeFields } from '../features/range/RangeFields'
import { useEventsInRange } from '../features/range/useEventsInRange'
import { ReviewCard } from '../features/review/ReviewCard'
import { CheckField, ReviewCardSkeleton, SpellingProgress } from '../features/review/ReviewParts'
import { buildReport, type FieldIssue, findIssues, groupEvents, VENUE_WORDS } from '../features/review/review'
import { useSpellcheck } from '../features/review/useSpellcheck'
import { useIgnoredWords } from '../features/review/ignoredWords'
import { siteUrl, useDocumentHead } from '../seo/useDocumentHead'
import { copyText } from '../lib/clipboard'

/**
 * O que verificar: ortografia (LanguageTool, mais lento) e perfis escritos errado. Ao abrir, sempre só
 * os perfis (não fica salvo).
 */
type Checks = { spelling: boolean; aliases: boolean }
const DEFAULT_CHECKS: Checks = { spelling: false, aliases: true }
/** Calendários revisados ao abrir: só o principal; cada responsável marca o seu. */
const DEFAULT_SOURCES: CalendarSource[] = ['pasdedeux']

/**
 * Revisão do texto dos eventos (/review): erros de ortografia (LanguageTool) e perfis do Instagram
 * escritos errado (aliases de promoters.json), com o texto corrigido para copiar e o link de cada
 * evento no Google Agenda. Pública, mas sem link no app nem no sitemap. As regras ficam em
 * features/review/review.ts.
 */
export default function Review() {
  useDocumentHead({ title: 'Revisão', description: 'Erros de texto nos eventos', canonical: `${siteUrl()}review/`, noindex: true })
  const { query, ...range } = useEventsInRange(90)
  // Palavras ignoradas: salvas no aparelho de quem revisa.
  const ignored = useIgnoredWords((state) => state.words)
  const setIgnored = useIgnoredWords((state) => state.setWords)
  const [checks, setChecks] = useState(DEFAULT_CHECKS)
  const toggle = (key: keyof Checks) => (on: boolean) => setChecks((current) => ({ ...current, [key]: on }))
  const [sources, setSources] = useState<CalendarSource[]>(DEFAULT_SOURCES)
  const toggleSource = (source: CalendarSource) => (on: boolean) =>
    setSources((current) => (on ? [...current, source] : current.filter((item) => item !== source)))
  const [choices, setChoices] = useState<Record<string, string | null>>({})
  const [copied, setCopied] = useState(false)

  // Eventos do período por calendário (para a contagem ao lado de cada caixa).
  const perSource = useMemo(
    () =>
      Object.fromEntries(CALENDAR_SOURCES.map((source) => [source, (query.data ?? []).filter((event) => event.source === source).length])),
    [query.data],
  )
  const groups = useMemo(() => groupEvents(query.data ?? [], sources), [query.data, sources])
  const texts = useMemo(() => [...new Set(groups.flatMap((group) => group.texts.map((text) => text.plain.text)))], [groups])
  const spelling = useSpellcheck(texts, checks.spelling)

  const ignoredSet = useMemo(() => new Set([...IGNORED_WORDS, ...VENUE_WORDS, ...ignored]), [ignored])
  const reviewed = useMemo(
    () => findIssues(groups, { aliases: checks.aliases, spelling: checks.spelling ? spelling.data : undefined, ignored: ignoredSet }),
    [groups, checks, spelling.data, ignoredSet],
  )
  const valueOf = (issue: FieldIssue) => (issue.id in choices ? choices[issue.id] : issue.suggestions[0])

  const copyAll = async () => {
    const calendars = sources.map((source) => CALENDARS[source].label)
    if (!(await copyText(buildReport(reviewed, valueOf, { calendars, from: range.from, to: range.to }), 'Copie o relatório:'))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const checkingSpelling = checks.spelling && spelling.isFetching
  // Skeleton enquanto os eventos chegam, e no fim da lista enquanto a ortografia ainda não voltou.
  const skeletons = query.isPending ? 3 : checkingSpelling ? 2 : 0
  const aliasCount = reviewed.filter(({ issues }) => issues.some((issue) => issue.kind === 'alias')).length
  const status = query.isPending
    ? 'Carregando eventos…'
    : query.isError
      ? `Erro: ${query.error.message}`
      : [
          `${groups.reduce((sum, group) => sum + group.events.length, 0)} de ${query.data.length} eventos (${groups.length} textos diferentes)`,
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
          .join(' · ')

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
          {status}
        </p>
        {checkingSpelling && <SpellingProgress done={spelling.progress} total={spelling.total} />}
        <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <legend className="mb-1 text-xs font-medium text-fg-muted">Calendários</legend>
          {CALENDAR_SOURCES.map((source) => (
            <CheckField
              key={source}
              label={`${CALENDARS[source].label} (${query.data ? perSource[source] : '…'})`}
              checked={sources.includes(source)}
              onChange={toggleSource(source)}
            />
          ))}
        </fieldset>
        <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <legend className="mb-1 text-xs font-medium text-fg-muted">Verificar</legend>
          <CheckField label="Perfis escritos errado (aliases)" checked={checks.aliases} onChange={toggle('aliases')} />
          <CheckField label="Ortografia (LanguageTool)" checked={checks.spelling} onChange={toggle('spelling')} />
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void copyAll()} disabled={reviewed.length === 0}>
            {copied ? <CheckIcon className="size-4" aria-hidden="true" /> : <CopyIcon className="size-4" aria-hidden="true" />}
            {copied ? 'Copiado' : 'Copiar tudo corrigido, com os links'}
          </Button>
          {ignored.length > 0 && (
            <Button variant="ghost" onClick={() => setIgnored([])}>
              Voltar a mostrar {ignored.length} palavras ignoradas
            </Button>
          )}
        </div>
      </Card>

      {reviewed.map(({ group, issues }) => (
        <ReviewCard
          key={group.key}
          group={group}
          issues={issues}
          chosenValue={valueOf}
          onChoose={(issue, value) => setChoices((current) => ({ ...current, [issue.id]: value }))}
          onIgnore={(word) => setIgnored([...new Set([...ignored, word.toLowerCase()])])}
        />
      ))}
      {Array.from({ length: skeletons }, (_, index) => (
        <ReviewCardSkeleton key={index} />
      ))}
    </section>
  )
}
