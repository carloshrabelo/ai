import { Clock, DoorOpen, Gift, GraduationCap, type LucideIcon, Moon, Receipt, User, UserCheck, Wine } from 'lucide-react'
import { labeledPrice, type PriceLabel, type PriceOption } from '../../domain/labeledPrice'
import type { Locale } from '../../i18n/locale'
import { translatePrice } from '../../i18n/price'
import type { PriceChipVariant } from './priceChipVariants'

// Preço em chips, cada valor com o seu rótulo ("5€ sócios", "3€ alunos LeT"), em variações para
// comparar em /teste/formato-precos.

const LABELS: Record<Locale, Record<PriceLabel, (arg?: string) => string>> = {
  'pt-BR': {
    members: () => 'sócios',
    nonMembers: () => 'não sócios',
    students: (arg) => (arg ? `alunos ${arg}` : 'alunos'),
    door: () => 'na porta',
    drink: () => 'bebida incluída',
    withDrink: () => 'com bebida',
    minimum: () => 'consumo mínimo',
    until: (hour) => `até ${hour}h`,
    after: () => 'depois',
  },
  'en-US': {
    members: () => 'members',
    nonMembers: () => 'non-members',
    students: (arg) => (arg ? `${arg} students` : 'students'),
    door: () => 'at the door',
    drink: () => 'drink included',
    withDrink: () => 'with a drink',
    minimum: () => 'minimum spend',
    until: (hour) => `until ${hour}am`,
    after: () => 'after',
  },
}

const ICONS: Record<PriceLabel, LucideIcon> = {
  members: UserCheck,
  nonMembers: User,
  students: GraduationCap,
  door: DoorOpen,
  drink: Wine,
  withDrink: Wine,
  minimum: Receipt,
  until: Clock,
  after: Moon,
}

const WORDS: Record<Locale, { free: string; flexible: string }> = {
  'pt-BR': { free: 'Gratuito', flexible: 'flexível' },
  'en-US': { free: 'Free', flexible: 'flexible' },
}

/** 5 → "5€" / "€5"; 7.5 → "7,50€" / "€7.50". */
function money(value: number, locale: Locale): string {
  const number = Number.isInteger(value) ? String(value) : value.toFixed(2)
  return locale === 'pt-BR' ? `${number.replace('.', ',')}€` : `€${number}`
}

/** Valor da opção ("5€", "Gratuito", "Pago") e o rótulo dela, no idioma. */
function describe(option: PriceOption, locale: Locale): { value: string; label?: string; icon?: LucideIcon } {
  const value =
    option.amount !== undefined
      ? money(option.amount, locale)
      : option.free
        ? WORDS[locale].free
        : translatePrice(option.text ?? '', locale)
  if (option.label) return { value, label: LABELS[locale][option.label](option.labelArg), icon: ICONS[option.label] }
  if (option.rawLabel) return { value, label: option.rawLabel }
  return { value, ...(option.free ? { icon: Gift } : {}) }
}

type Item = ReturnType<typeof describe> & { detail: boolean }

/** Chips unidos, separados por traço (valor e o seu detalhe, ou a variação "Grupo"). */
function Joined({ items }: { items: Item[] }) {
  return (
    <span className="inline-flex divide-x divide-border overflow-hidden rounded-full border border-border text-xs tabular-nums">
      {items.map(({ value, label }) => (
        <span key={value + label} className="px-2 py-0.5 whitespace-nowrap">
          <span className="font-semibold">{value}</span>
          {label && <span className="text-fg-muted"> {label}</span>}
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

const CHIP = 'inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs tabular-nums whitespace-nowrap'

/** Um preço do calendário (texto cru) em chips, na variação escolhida. */
export function PriceChips({ price, variant, locale }: { price: string; variant: PriceChipVariant; locale: Locale }) {
  const parsed = labeledPrice(price)
  // Faixa ("5€ to 15€") também em dois chips: 5€ e 15€.
  const items: Item[] = parsed.options.map((option) => ({ ...describe(option, locale), detail: !!option.detail }))
  // Observação no idioma ("5€?" → "€5?"), sem a maiúscula que o translatePrice põe no começo.
  const note = parsed.note && translatePrice(parsed.note, locale)
  const extras = [
    parsed.flexible ? WORDS[locale].flexible : undefined,
    note && parsed.note && /^\p{Ll}/u.test(parsed.note) ? note.charAt(0).toLowerCase() + note.slice(1) : note,
  ].filter(Boolean)

  const trailing = extras.length > 0 && <span className="text-xs text-fg-muted">{extras.join(' · ')}</span>

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
              <span className="font-semibold">{group[0].value}</span>
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
      {items.map(({ value, label, icon: Icon }, index) => {
        const key = value + label
        switch (variant) {
          case 'plain':
            return (
              <span key={key} className={CHIP}>
                <span className="font-semibold">{value}</span>
              </span>
            )
          case 'inline':
            return (
              <span key={key} className={CHIP}>
                <span className="font-semibold">{value}</span>
                {label && <span className="text-fg-muted">{label}</span>}
              </span>
            )
          case 'stacked':
            return (
              <span
                key={key}
                className="inline-flex flex-col items-center rounded-lg border border-border px-2 py-0.5 text-xs leading-tight tabular-nums"
              >
                <span className="font-semibold">{value}</span>
                {label && <span className="text-[10px] text-fg-muted">{label}</span>}
              </span>
            )
          case 'icon':
            return (
              <span key={key} className={CHIP} title={label}>
                <span className="font-semibold">{value}</span>
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
                <span className="font-semibold">{value}</span>
                {label && <span className={index === 0 ? 'opacity-80' : 'text-fg-muted'}>{label}</span>}
              </span>
            )
        }
      })}
      {trailing}
    </span>
  )
}
