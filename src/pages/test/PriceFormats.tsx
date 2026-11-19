import { Clock, MapPin, Ticket } from 'lucide-react'
import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Segmented } from '../../components/ui/Segmented'
import { PriceChips } from '../../features/events/PriceChips'
import { PriceFormat } from '../../features/events/PriceFormat'
import { PRICE_CHIP_VARIANTS, type PriceChipVariant } from '../../features/events/priceChipVariants'
import { PRICE_FORMATS, type PriceFormatId } from '../../features/events/priceFormats'
import type { Locale } from '../../i18n/locale'
import { siteUrl, useDocumentHead } from '../../seo/useDocumentHead'
import { BackToTest } from './shared'

/** Preços como vêm do calendário (os reais, de /teste/precos, e casos de borda). */
const SAMPLES = [
  '5€ ou 10€',
  '€5 for members / €10 for non-members',
  '15€ | 20€',
  '€12 or €17 or €20',
  '5€ to 15€ (flexible)',
  '5€ / 3€ for students of LeT',
  '5€ ou Gratuito',
  '10€ (8€ bebida incluída)',
  '10€ até 01h após 12€',
  '7,50€ ou 10€',
  '5€',
  'Gratuito',
  'Pago (5€?)',
]

/** Cards de exemplo para ver o formato no lugar real. */
/** Preços com qualificação por valor, para as variações de chips. */
const CHIP_SAMPLES = [
  '€5 for members / €10 for non-members',
  '5€ / 3€ for students of LeT',
  '10€ (8€ bebida incluída)',
  '20€ ou 15€ (alunos)',
  '7€ ou 9€ (porta)',
  '10€ até 01h após 12€',
  '5€ to 15€ (flexible)',
  '5€ ou Gratuito',
  '10€ com bebida',
  '10€ (consumo mínimo)',
  '€12 or €17 or €20',
  '15€ | 20€',
  '5€',
  'Pago (5€?)',
]

const CHIP_CARDS = [
  { title: 'Mafondana Social', place: 'Mafondana Café', time: '21:00 – 00:00', price: '€5 for members / €10 for non-members' },
  { title: 'Milonga Lisboa em Tango', place: 'Rua de Santa Apolónia 59', time: '20:30 – 23:00', price: '5€ / 3€ for students of LeT' },
  { title: 'Latin Fiesta', place: 'Iate Ben', time: '21:30 – 03:00', price: '10€ (8€ bebida incluída)' },
  { title: 'Baile da Pista', place: 'Lx Factory', time: '22:00 – 04:00', price: '10€ até 01h após 12€' },
]

const CARDS = [
  { title: 'Milonga Maluca', place: 'Studio Bacalhau', time: '19:00 – 21:30', price: '5€ to 15€ (flexible)' },
  { title: 'Mafondana Social', place: 'Mafondana Café', time: '21:00 – 00:00', price: '€5 for members / €10 for non-members' },
  { title: 'Despedida Camila Alves', place: 'Casa do Concelho de Tomar', time: '20:00 – 02:00', price: '€12 or €17 or €20' },
  { title: 'Swing Jam', place: 'Little Big Apple', time: '20:30 – 23:30', price: '15€ | 20€' },
]

/**
 * Página de teste (/teste/formato-precos, pública mas sem link no app): jeitos de exibir preços com
 * mais de um valor ("5€ ou 10€", "5€ a 15€"), lado a lado e num card de evento.
 */
export default function PriceFormats() {
  useDocumentHead({
    title: 'Formato de preços (teste)',
    description: 'Como exibir preços com mais de um valor',
    canonical: `${siteUrl()}teste/formato-precos`,
    noindex: true,
  })
  const [locale, setLocale] = useState<Locale>('pt-BR')
  const [format, setFormat] = useState<PriceFormatId>('text')
  const chosen = PRICE_FORMATS.find((item) => item.id === format)
  const [chipVariant, setChipVariant] = useState<PriceChipVariant>('auto')
  const chosenChip = PRICE_CHIP_VARIANTS.find((item) => item.id === chipVariant)

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <BackToTest />
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Formato de preços</h2>
        <p className="text-sm text-fg-muted">
          Preços com mais de um valor, em cada formato. O texto do calendário é padronizado (src/i18n/price.ts) e separado em partes
          (src/domain/priceParts.ts); preço de um valor só aparece igual em todos.
        </p>
        <Segmented
          label="Idioma"
          options={[
            { value: 'pt-BR', label: 'Português' },
            { value: 'en-US', label: 'English' },
          ]}
          value={locale}
          onChange={setLocale}
        />
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-fg-muted">
            <tr>
              <th scope="col" className="sticky left-0 bg-surface px-4 py-2 font-medium">
                No calendário
              </th>
              {PRICE_FORMATS.map((item) => (
                <th key={item.id} scope="col" className="px-4 py-2 font-medium whitespace-nowrap" title={item.hint}>
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLES.map((price) => (
              <tr key={price} className="border-b border-border last:border-0">
                <th
                  scope="row"
                  className="sticky left-0 min-w-56 bg-surface px-4 py-2 align-top font-mono text-xs font-normal text-fg-muted"
                >
                  {price}
                </th>
                {PRICE_FORMATS.map((item) => (
                  <td key={item.id} className="px-4 py-2 align-top whitespace-nowrap">
                    <PriceFormat price={price} format={item.id} locale={locale} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-semibold">No card do evento</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as PriceFormatId)}
            aria-label="Formato"
            className="h-11 rounded-lg border border-border bg-surface px-3 text-sm"
          >
            {PRICE_FORMATS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-fg-muted">{chosen?.hint}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {CARDS.map((card) => (
            <div key={card.title} className="space-y-1.5 rounded-xl border border-border bg-surface p-4">
              <p className="text-lg font-semibold">{card.title}</p>
              <p className="flex items-center gap-2 text-sm text-fg-muted">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {card.place}
              </p>
              <p className="flex items-start gap-4 text-sm text-fg-muted">
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Clock className="size-4 shrink-0" aria-hidden="true" />
                  {card.time}
                </span>
                <span className="flex min-w-0 items-start gap-2">
                  <Ticket className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <PriceFormat price={card.price} format={format} locale={locale} />
                </span>
              </p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">Chips com rótulos</h2>
        <p className="text-sm text-fg-muted">
          Cada valor com a sua qualificação (sócios, alunos, bebida, porta, até 1h…), lida do texto do calendário sem descartar nada
          (src/domain/labeledPrice.ts).
        </p>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-fg-muted">
            <tr>
              <th scope="col" className="sticky left-0 bg-surface px-4 py-2 font-medium">
                No calendário
              </th>
              {PRICE_CHIP_VARIANTS.map((item) => (
                <th key={item.id} scope="col" className="px-4 py-2 font-medium whitespace-nowrap" title={item.hint}>
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CHIP_SAMPLES.map((price) => (
              <tr key={price} className="border-b border-border last:border-0">
                <th
                  scope="row"
                  className="sticky left-0 min-w-56 bg-surface px-4 py-2 align-top font-mono text-xs font-normal text-fg-muted"
                >
                  {price}
                </th>
                {PRICE_CHIP_VARIANTS.map((item) => (
                  <td key={item.id} className="px-4 py-2 align-top">
                    <PriceChips price={price} variant={item.id} locale={locale} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-semibold">Chips no card do evento</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={chipVariant}
            onChange={(e) => setChipVariant(e.target.value as PriceChipVariant)}
            aria-label="Variação dos chips"
            className="h-11 rounded-lg border border-border bg-surface px-3 text-sm"
          >
            {PRICE_CHIP_VARIANTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-fg-muted">{chosenChip?.hint}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {CHIP_CARDS.map((card) => (
            <div key={card.title} className="space-y-1.5 rounded-xl border border-border bg-surface p-4">
              <p className="text-lg font-semibold">{card.title}</p>
              <p className="flex items-center gap-2 text-sm text-fg-muted">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {card.place}
              </p>
              <p className="flex items-center gap-2 text-sm text-fg-muted">
                <Clock className="size-4 shrink-0" aria-hidden="true" />
                {card.time}
              </p>
              <p className="flex items-start gap-2 text-sm">
                <Ticket className="mt-0.5 size-4 shrink-0 text-fg-muted" aria-hidden="true" />
                <PriceChips price={card.price} variant={chipVariant} locale={locale} />
              </p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
