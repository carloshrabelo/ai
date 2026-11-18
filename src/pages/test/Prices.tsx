import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { addDays, type IsoDate, isIsoDate, todayIso } from '../../data/dates'
import { loadEvents } from '../../data/loadEvents'
import { siteUrl, useDocumentHead } from '../../seo/useDocumentHead'

/** Período padrão: 3 meses para trás e 6 para frente. */
const DAYS_BEFORE = 90
const DAYS_AFTER = 180

type PriceRow = { price: string; count: number }

/**
 * Página de teste (/teste/precos, só com VITE_TEST_PAGES=true): todos os preços distintos dos
 * eventos do período, para montar os dicionários de tradução. Sem i18n: é ferramenta interna.
 */
export default function Prices() {
  useDocumentHead({ title: 'Preços (teste)', description: 'Lista de preços dos eventos', canonical: `${siteUrl()}teste/precos`, noindex: true })
  const today = todayIso()
  const [from, setFrom] = useState<IsoDate>(addDays(today, -DAYS_BEFORE))
  const [to, setTo] = useState<IsoDate>(addDays(today, DAYS_AFTER))
  const [copied, setCopied] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['test-prices', from, to],
    queryFn: ({ signal }) => loadEvents(from, to, signal),
    enabled: from < to,
    staleTime: Infinity,
  })

  const { rows, withPrice } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const event of query.data ?? []) {
      const price = event.price?.trim()
      if (price) counts.set(price, (counts.get(price) ?? 0) + 1)
    }
    const rows: PriceRow[] = [...counts].map(([price, count]) => ({ price, count }))
    rows.sort((a, b) => b.count - a.count || a.price.localeCompare(b.price, 'pt'))
    return { rows, withPrice: rows.reduce((sum, row) => sum + row.count, 0) }
  }, [query.data])

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }
  const asList = () => rows.map((row) => row.price).join('\n')
  // Modelo de dicionário: preço original → tradução (vazia, para preencher).
  const asJson = () => JSON.stringify(Object.fromEntries(rows.map((row) => [row.price, ''])), null, 2)

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Preços dos eventos</h2>
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <DateField label="De" value={from} onChange={setFrom} />
          <DateField label="Até" value={to} onChange={setTo} />
        </div>
        <p className="text-sm text-fg-muted">
          {query.isPending
            ? 'Carregando eventos…'
            : query.isError
              ? `Erro: ${query.error.message}`
              : `${query.data.length} eventos · ${withPrice} com preço · ${rows.length} preços distintos`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={rows.length === 0} onClick={() => copy('list', asList())}>
            {copied === 'list' ? 'Copiado!' : 'Copiar lista'}
          </Button>
          <Button variant="secondary" disabled={rows.length === 0} onClick={() => copy('json', asJson())}>
            {copied === 'json' ? 'Copiado!' : 'Copiar JSON (dicionário)'}
          </Button>
        </div>
      </Card>

      {rows.length > 0 && (
        <Card className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-fg-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  Preço
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Eventos
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.price} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 break-words">{row.price}</td>
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

function DateField({ label, value, onChange }: { label: string; value: IsoDate; onChange: (value: IsoDate) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-fg-muted">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => isIsoDate(e.target.value) && onChange(e.target.value)}
        className="h-11 rounded-lg border border-border bg-surface px-3"
      />
    </label>
  )
}
