import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { normalizePrice, translatePrice } from '../../i18n/price'
import { siteUrl, useDocumentHead } from '../../seo/useDocumentHead'
import { BackToTest, RangeFields } from './shared'
import { useEventsInRange } from './useEventsInRange'

type PriceRow = { price: string; count: number; pt: string; en: string; untranslated: boolean }

/**
 * Página de teste (/teste/precos, só com VITE_TEST_PAGES=true): todos os preços distintos dos
 * eventos do período e a tradução de cada um (src/i18n/price.ts), para revisar e completar o
 * dicionário. Sem i18n: é ferramenta interna.
 */
export default function Prices() {
  useDocumentHead({ title: 'Preços (teste)', description: 'Lista de preços dos eventos', canonical: `${siteUrl()}teste/precos`, noindex: true })
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
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }
  const asList = () => rows.map((row) => row.price).join('\n')
  // Dicionário atual: preço original → texto em cada idioma.
  const asJson = () =>
    JSON.stringify(Object.fromEntries(rows.map((row) => [row.price, { 'pt-BR': row.pt, 'en-US': row.en }])), null, 2)

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
                  Original
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  pt-BR
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  en-US
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
