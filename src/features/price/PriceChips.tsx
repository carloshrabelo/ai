import {
  ClockIcon,
  DoorOpenIcon,
  GiftIcon,
  GraduationCapIcon,
  type Icon,
  MoonIcon,
  QuestionIcon,
  ReceiptIcon,
  UserCheckIcon,
  UserIcon,
  WineIcon,
} from '@phosphor-icons/react'
import { formatEuro } from '../../lib/money'
import { labeledPrice, type PriceLabel, type PriceOption } from '../../domain/price/labeledPrice'
import type { Locale } from '../../i18n/locale'
import { translatePrice } from '../../domain/price/translatePrice'
import { MESSAGES } from '../../i18n/messages'
import { useI18n } from '../../i18n/useI18n'

// Preço em chips, cada valor com o seu rótulo ("5€ sócios", "3€ alunos LeT"), em variações para
// comparar em /lab/price-formats.

/** Texto do rótulo no idioma (textos em src/i18n/messages, seção `price`). */
function labelText(label: PriceLabel, arg: string | undefined, locale: Locale): string {
  const text = MESSAGES[locale].price
  if (label === 'students') return text.students(arg)
  if (label === 'until') return text.until(arg ?? '')
  return text[label]
}

const ICONS: Record<PriceLabel, Icon> = {
  members: UserCheckIcon,
  nonMembers: UserIcon,
  students: GraduationCapIcon,
  door: DoorOpenIcon,
  drink: WineIcon,
  withDrink: WineIcon,
  minimum: ReceiptIcon,
  until: ClockIcon,
  after: MoonIcon,
}

/** Valor da opção ("5€", "Gratuito", "Pago") e o rótulo dela, no idioma. */
function describe(option: PriceOption, locale: Locale): { value: string; label?: string; icon?: Icon; uncertain?: string } {
  const value =
    option.amount !== undefined
      ? formatEuro(option.amount, locale)
      : option.free
        ? MESSAGES[locale].price.free
        : translatePrice(option.text ?? '', locale)
  const uncertain = option.uncertain ? MESSAGES[locale].price.uncertain : undefined
  if (option.label) return { value, uncertain, label: labelText(option.label, option.labelArg, locale), icon: ICONS[option.label] }
  if (option.rawLabel) return { value, uncertain, label: option.rawLabel }
  return { value, uncertain, ...(option.free ? { icon: GiftIcon } : {}) }
}

type Item = ReturnType<typeof describe> & { detail: boolean }

/** Valor em negrito; não confirmado ("Pago (5€?)"), com o ícone de dúvida no lugar do "?". */
function Amount({ value, uncertain }: { value: string; uncertain?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 font-semibold" title={uncertain}>
      {value}
      {uncertain && (
        <>
          <QuestionIcon className="size-3.5 text-fg-muted" aria-hidden="true" />
          <span className="sr-only"> ({uncertain})</span>
        </>
      )}
    </span>
  )
}

/** Chips unidos, separados por traço (valor e o seu detalhe, ou a variação "Grupo"). */
function Joined({ items }: { items: Item[] }) {
  return (
    <span className="inline-flex h-7 items-stretch divide-x-2 divide-border overflow-hidden rounded-xl border-2 border-border text-[13px] font-bold tabular-nums">
      {items.map(({ value, label, uncertain }) => (
        // gap-1: num flex, o espaço no começo do rótulo some ("8€bebida incluída").
        <span key={value + label} className="flex items-center gap-1 px-2 whitespace-nowrap">
          <Amount value={value} uncertain={uncertain} />
          {label && <span className="text-fg-muted">{label}</span>}
        </span>
      ))}
    </span>
  )
}

/** Cada valor com os seus detalhes logo depois: [[10€, 8€ bebida incluída]], [[5€], [10€]]. */
function groupDetails(items: Item[]): Item[][] {
  const groups: Item[][] = []
  for (const item of items) {
    if (item.detail && groups.length > 0) groups[groups.length - 1].push(item)
    else groups.push([item])
  }
  return groups
}

/**
 * Variações de chips. O app usa `auto` (rótulo no chip; valor com detalhe unido a ele); as outras
 * ficam para comparar em /lab/price-formats.
 */
export type PriceChipVariant = 'auto' | 'plain' | 'inline' | 'stacked' | 'icon' | 'primary' | 'segmented'

// Chip neutro do tema (moldura de 2px, cantos de 12px), sem a base 3D dos gêneros: preço não é clicável.
const CHIP =
  'inline-flex h-7 items-center gap-1 rounded-xl border-2 border-border px-2 text-[13px] font-bold tabular-nums whitespace-nowrap'

/** Um preço do calendário (texto cru) em chips, na variação escolhida. */
export function PriceChips({ price, variant, locale }: { price: string; variant: PriceChipVariant; locale: Locale }) {
  const parsed = labeledPrice(price)
  // Faixa ("5€ to 15€") também em dois chips: 5€ e 15€.
  const items: Item[] = parsed.options.map((option) => ({ ...describe(option, locale), detail: !!option.detail }))
  // Observação no idioma ("5€?" → "€5?"), sem a maiúscula que o translatePrice põe no começo.
  const note = parsed.note && translatePrice(parsed.note, locale)
  const extras = [
    parsed.flexible ? MESSAGES[locale].price.flexible : undefined,
    note && parsed.note && /^\p{Ll}/u.test(parsed.note) ? note.charAt(0).toLowerCase() + note.slice(1) : note,
  ].filter(Boolean)

  const trailing = extras.length > 0 && <span className="text-[13px] text-fg-muted">{extras.join(' · ')}</span>

  if (variant === 'segmented') {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <Joined items={items} />
        {trailing}
      </span>
    )
  }

  // Rótulo no chip; um valor com detalhe fica unido a ele, em grupo.
  if (variant === 'auto') {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        {groupDetails(items).map((group) =>
          group.length > 1 ? (
            <Joined key={group.map((item) => item.value).join()} items={group} />
          ) : (
            <span key={group[0].value + group[0].label} className={CHIP}>
              <Amount value={group[0].value} uncertain={group[0].uncertain} />
              {group[0].label && <span className="text-fg-muted">{group[0].label}</span>}
            </span>
          ),
        )}
        {trailing}
      </span>
    )
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {items.map(({ value, label, uncertain, icon: Icon }, index) => {
        const key = value + label
        switch (variant) {
          case 'plain':
            return (
              <span key={key} className={CHIP}>
                <Amount value={value} uncertain={uncertain} />
              </span>
            )
          case 'inline':
            return (
              <span key={key} className={CHIP}>
                <Amount value={value} uncertain={uncertain} />
                {label && <span className="text-fg-muted">{label}</span>}
              </span>
            )
          case 'stacked':
            return (
              <span
                key={key}
                className="inline-flex flex-col items-center rounded-lg border border-border px-2 py-0.5 text-xs leading-tight tabular-nums"
              >
                <Amount value={value} uncertain={uncertain} />
                {label && <span className="text-[10px] text-fg-muted">{label}</span>}
              </span>
            )
          case 'icon':
            return (
              <span key={key} className={CHIP} title={label}>
                <Amount value={value} uncertain={uncertain} />
                {Icon ? (
                  <Icon className="size-3.5 text-fg-muted" aria-hidden="true" />
                ) : (
                  label && <span className="text-fg-muted">{label}</span>
                )}
                {Icon && label && <span className="sr-only">{label}</span>}
              </span>
            )
          case 'primary':
            return (
              <span key={key} className={`${CHIP} ${index === 0 ? 'border-brand bg-brand text-brand-fg' : ''}`}>
                <Amount value={value} uncertain={uncertain} />
                {label && <span className={index === 0 ? 'opacity-80' : 'text-fg-muted'}>{label}</span>}
              </span>
            )
        }
      })}
      {trailing}
    </span>
  )
}

/**
 * Evento sem preço identificado: "Ver descrição | Consultar organizador", unidos e com borda
 * tracejada (não é um preço). Sem descrição, só "Consultar organizador".
 */
export function NoPriceChips({ hasDescription }: { hasDescription: boolean }) {
  const { t } = useI18n()
  const parts = [hasDescription ? t.event.seeDescription : undefined, t.event.askOrganizer].filter((part): part is string => !!part)
  return (
    <span className="inline-flex h-7 items-stretch divide-x-2 divide-dashed divide-border overflow-hidden rounded-xl border-2 border-dashed border-border text-[13px] font-semibold text-fg">
      {parts.map((part) => (
        <span key={part} className="flex items-center px-2 whitespace-nowrap">
          {part}
        </span>
      ))}
    </span>
  )
}
