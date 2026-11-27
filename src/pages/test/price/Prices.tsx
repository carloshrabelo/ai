import { QuestionIcon, TicketIcon } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { PriceChips } from '../../../features/price/PriceChips'
import { normalizePrice, translatePrice } from '../../../domain/price/translatePrice'
import { siteUrl, useDocumentHead } from '../../../seo/useDocumentHead'
import { RangeFields } from '../../../features/range/RangeFields'
import { BackToTest } from '../shared'
import { useEventsInRange } from '../../../features/range/useEventsInRange'
import { copyText } from '../../../lib/clipboard'

/**
 * Sugestões de texto para evento sem preço identificado; o app usa o grupo "Ver descrição | Consultar
 * organizador" (NoPriceChips). `icon`: com o
 * ícone de dúvida, como o valor não confirmado de "Pago (5€?)".
 */
const NO_PRICE_TERMS: { pt: string; en: string; icon?: boolean; note: string }[] = [
  {
    pt: 'Ver descrição | Consultar organizador',
    en: 'See description | Ask the organizer',
    note: 'Escolhido: os dois juntos, em grupo. É o que o app mostra (sem descrição, só "Consultar organizador").',
  },
  { pt: 'A confirmar', en: 'To be confirmed', icon: true, note: 'Neutro e curto; combina com o ícone de valor não confirmado.' },
  { pt: 'Preço não informado', en: 'Price not listed', note: 'Factual: o calendário não traz o preço. Mais longo.' },
  { pt: 'Consultar organizador', en: 'Ask the organizer', note: 'Diz o que fazer; bom quando há @ do organizador.' },
  { pt: 'Ver descrição', en: 'See description', note: 'Às vezes o preço está no texto e não foi reconhecido.' },
  { pt: 'Sem informação', en: 'No info', note: 'Curto, mas vago (sem informação de quê?).' },
  { pt: '—', en: '—', note: 'Só um traço: mínimo, mas pode parecer erro.' },
  { pt: '', en: '', icon: true, note: 'Só o ícone, com o texto "a confirmar" no title e para leitor de tela.' },
  { pt: 'Sem preço', en: 'No price', note: 'Evitar: pode ser lido como gratuito.' },
]

type PriceRow = { price: string; count: number; pt: string; en: string; untranslated: boolean }

/**
 * Página de teste (/lab/prices, pública mas sem link no app): todos os preços distintos dos
 * eventos do período e a tradução de cada um (src/domain/price/translatePrice.ts), para revisar e completar o
 * dicionário. Sem i18n: é ferramenta interna.
 */
export default function Prices() {
  useDocumentHead({
    title: 'Preços (teste)',
    description: 'Lista de preços dos eventos',
    canonical: `${siteUrl()}lab/precos`,
    noindex: true,
  })
  const { query, ...range } = useEventsInRange()
  const [copied, setCopied] = useState<string | null>(null)

  const { rows, withPrice, untranslated } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const event of query.data ?? []) {
      const price = event.price?.trim()
      if (price) counts.set(price, (counts.get(price) ?? 0) + 1)
    }
    const rows: PriceRow[] = [...counts].map(([price, count]) => {
      const pt = normalizePrice(price)
      const en = translatePrice(price, 'en-US')
      // Texto com letras que passou igual pelo tradutor: falta regra (ou não é preço).
      return { price, count, pt, en, untranslated: /\p{L}/u.test(pt) && en === pt }
    })
    rows.sort((a, b) => b.count - a.count || a.price.localeCompare(b.price, 'pt'))
    return {
      rows,
      withPrice: rows.reduce((sum, row) => sum + row.count, 0),
      untranslated: rows.filter((row) => row.untranslated).length,
    }
  }, [query.data])

  const copy = async (label: string, text: string) => {
    if (!(await copyText(text, 'Copie:'))) return
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }
  const asList = () => rows.map((row) => row.price).join('\n')
  // Dicionário atual: preço original → texto em cada idioma.
  const asJson = () => JSON.stringify(Object.fromEntries(rows.map((row) => [row.price, { 'pt-BR': row.pt, 'en-US': row.en }])), null, 2)

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <BackToTest />
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Preços dos eventos</h2>
        <RangeFields {...range} />
        <p className="text-sm text-fg-muted">
          {query.isPending
            ? 'Carregando eventos…'
            : query.isError
              ? `Erro: ${query.error.message}`
              : `${query.data.length} eventos · ${withPrice} com preço · ${rows.length} preços distintos · ${untranslated} sem tradução`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={rows.length === 0} onClick={() => void copy('list', asList())}>
            {copied === 'list' ? 'Copiado!' : 'Copiar lista'}
          </Button>
          <Button variant="secondary" disabled={rows.length === 0} onClick={() => void copy('json', asJson())}>
            {copied === 'json' ? 'Copiado!' : 'Copiar JSON (dicionário)'}
          </Button>
        </div>
      </Card>

      <NoPriceTerms total={query.data?.length} withPrice={withPrice} />

      {rows.length > 0 && (
        <Card className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-fg-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  Original
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  pt-BR
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  en-US
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  No app (chips)
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Eventos
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.price} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 break-words text-fg-muted">{row.price}</td>
                  <td className={`px-4 py-2 break-words ${row.pt !== row.price ? 'font-medium' : ''}`}>{row.pt}</td>
                  <td className="px-4 py-2 break-words">
                    {row.en}
                    {row.untranslated && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-amber-900">
                        sem tradução
                      </span>
                    )}
                  </td>
                  <td className="space-y-1 px-4 py-2">
                    <span className="block">
                      <PriceChips price={row.price} variant="auto" locale="pt-BR" />
                    </span>
                    <span className="block">
                      <PriceChips price={row.price} variant="auto" locale="en-US" />
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  )
}

/** Sugestões de termo para quando o preço não foi identificado, com a prévia em chip. */
function NoPriceTerms({ total, withPrice }: { total?: number; withPrice: number }) {
  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Sem preço identificado</h2>
        <p className="text-sm text-fg-muted">
          {total === undefined ? 'Carregando…' : `${total - withPrice} eventos do período sem preço no título nem na descrição`} (lista em{' '}
          <Link to="/lab/no-price" className="font-medium text-brand hover:underline">
            /lab/no-price
          </Link>
          ). O app mostra o primeiro (o grupo); as outras sugestões ficam para comparar:
        </p>
      </div>
      <ul className="divide-y divide-border">
        {NO_PRICE_TERMS.map((term) => (
          <li
            key={term.pt || 'icone'}
            className="grid gap-x-4 gap-y-1 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] sm:items-center"
          >
            <TermChip text={term.pt} icon={term.icon} label="a confirmar" />
            <TermChip text={term.en} icon={term.icon} label="to be confirmed" />
            <span className="text-fg-muted">{term.note}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function TermChip({ text, icon, label }: { text: string; icon?: boolean; label: string }) {
  return (
    <span className="flex items-center gap-2 text-fg-muted">
      <TicketIcon className="size-4 shrink-0" aria-hidden="true" />
      <span
        className="inline-flex w-fit items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs whitespace-nowrap"
        title={icon ? label : undefined}
      >
        {text.includes(' | ')
          ? text.split(' | ').map((part, index) => (
              <span key={part} className={index > 0 ? 'border-l border-dashed border-border pl-1.5' : ''}>
                {part}
              </span>
            ))
          : text}
        {icon && <QuestionIcon className="size-3.5" aria-hidden="true" />}
        {icon && !text && <span className="sr-only">{label}</span>}
      </span>
    </span>
  )
}
