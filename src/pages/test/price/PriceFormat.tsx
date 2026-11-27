import { formatEuro } from '../../../lib/money'
import { type PriceParts, priceParts } from '../../../domain/price/priceParts'
import type { Locale } from '../../../i18n/locale'
import { normalizePrice, translatePrice } from '../../../domain/price/translatePrice'
import type { PriceFormatId } from './formatOptions'

// Jeitos de exibir um preço com mais de um valor ("5€ ou 10€", "5€ a 15€"), para comparar em
// /lab/price-formats. Preço com um valor só (ou texto como "Pago") aparece igual em todos.

const WORDS: Record<Locale, { from: string; free: string }> = {
  'pt-BR': { from: 'a partir de', free: 'Gratuito' },
  'en-US': { from: 'from', free: 'Free' },
}

/** Trecho no idioma, sem a maiúscula que o translatePrice põe no começo ("para alunos de LeT"). */
function inline(text: string, locale: Locale): string {
  const translated = translatePrice(text, locale)
  return /^\p{Ll}/u.test(text) ? translated.charAt(0).toLowerCase() + translated.slice(1) : translated
}

/** Faixa compacta: "5–10€" / "€5–10". */
function range(min: number, max: number, locale: Locale): string {
  const [a, b] = [min, max].map((value) => formatEuro(value, locale).replace('€', ''))
  return locale === 'pt-BR' ? `${a}–${b}€` : `€${a}–${b}`
}

function Note({ parts, locale }: { parts: PriceParts; locale: Locale }) {
  return parts.note ? <span className="text-fg-muted"> {inline(parts.note, locale)}</span> : null
}

/** Um preço do calendário (texto cru) no formato escolhido. */
export function PriceFormat({ price, format, locale }: { price: string; format: PriceFormatId; locale: Locale }) {
  const parts = priceParts(normalizePrice(price))
  const options = parts.options.map((option) => inline(option, locale))
  const multiple = parts.kind === 'alternatives' || parts.kind === 'range'
  const hasFree = parts.min === 0

  if (format === 'text' || !multiple) return <span>{translatePrice(price, locale)}</span>

  switch (format) {
    case 'dot':
    case 'slash':
      return (
        <span>
          {options.join(format === 'dot' ? ' · ' : ' / ')}
          <Note parts={parts} locale={locale} />
        </span>
      )
    case 'range':
      return (
        <span>
          {hasFree || parts.min === undefined || parts.max === undefined ? options.join(' · ') : range(parts.min, parts.max, locale)}
          <Note parts={parts} locale={locale} />
        </span>
      )
    case 'from':
      return (
        <span>
          {hasFree || parts.min === undefined ? options.join(' · ') : `${WORDS[locale].from} ${formatEuro(parts.min, locale)}`}
          <Note parts={parts} locale={locale} />
        </span>
      )
    case 'chips':
      return (
        <span className="inline-flex flex-wrap items-center gap-1">
          {options.map((option) => (
            <span key={option} className="rounded-full border border-border px-2 text-xs font-medium tabular-nums">
              {option}
            </span>
          ))}
          <Note parts={parts} locale={locale} />
        </span>
      )
    case 'primary':
      return (
        <span title={options.join(' · ')}>
          <span className="font-medium">{options[0]}</span>
          {parts.kind === 'range' ? (
            <span className="text-fg-muted"> – {options.at(-1)}</span>
          ) : (
            <span className="ml-1 rounded bg-surface-muted px-1 text-xs text-fg-muted">+{options.length - 1}</span>
          )}
          <Note parts={parts} locale={locale} />
        </span>
      )
    case 'stacked':
      return (
        <span className="inline-flex flex-col leading-tight">
          {options.map((option) => (
            <span key={option}>{option}</span>
          ))}
          {parts.note && <span className="text-xs text-fg-muted">{inline(parts.note, locale)}</span>}
        </span>
      )
  }
}
