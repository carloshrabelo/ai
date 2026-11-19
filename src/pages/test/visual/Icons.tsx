import { Check, ChevronDown, Copy } from 'lucide-react'
import { createElement, type ReactNode, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { siteUrl, useDocumentHead } from '../../../seo/useDocumentHead'
import { BackToTest } from '../shared'

import { currentIndex, type Group, type GroupId, GROUPS, type IconComponent, SECTIONS } from './iconGroups'

/**
 * Página de teste (/teste/icones, pública mas sem link no app): opções para cada ícone do app (menu,
 * agenda e mapa, card e detalhes), todas da Lucide, com uma amostra fixa das telas usando os
 * ícones escolhidos.
 */
export default function Icons() {
  useDocumentHead({
    title: 'Ícones (teste)',
    description: 'Sugestões de ícones',
    canonical: `${siteUrl()}teste/icones`,
    noindex: true,
  })
  const [choice, setChoice] = useState<Record<GroupId, number>>(
    () => Object.fromEntries(GROUPS.map((group) => [group.id, currentIndex(group.options)])) as Record<GroupId, number>,
  )
  const [copied, setCopied] = useState(false)
  // Acordeon: um grupo de opções aberto por vez (fechado, mostra só a escolha).
  const [openGroup, setOpenGroup] = useState<GroupId | null>(null)

  const chosen = (id: GroupId) => {
    const group = GROUPS.find((item) => item.id === id) as Group
    return group.options[choice[id]]
  }

  const copy = async () => {
    await navigator.clipboard.writeText(GROUPS.map((group) => `${group.title}: ${chosen(group.id).name}`).join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <BackToTest />
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Ícones</h2>
          <p className="text-sm text-fg-muted">
            Cada ícone do app com opções da Lucide (a biblioteca do app). A amostra abaixo usa os escolhidos.
          </p>
        </div>
        <Sample icon={(id) => chosen(id).icon} />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={copy}>
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? 'Copiado' : 'Copiar escolha'}
          </Button>
        </div>
      </Card>

      {SECTIONS.map((section) => (
        <div key={section} className="space-y-2">
          <h3 className="pt-2 text-sm font-semibold text-fg-muted">{section}</h3>
          {GROUPS.filter((group) => group.section === section).map((group) => (
            <IconChoices
              key={group.id}
              group={group}
              value={choice[group.id]}
              onChange={(index) => setChoice((current) => ({ ...current, [group.id]: index }))}
              open={openGroup === group.id}
              onToggle={() => setOpenGroup((current) => (current === group.id ? null : group.id))}
            />
          ))}
        </div>
      ))}
    </section>
  )
}

/** Amostra fixa das telas (menu, faixa de dias, card, ações dos detalhes) com os ícones escolhidos. */
function Sample({ icon }: { icon: (id: GroupId) => IconComponent }) {
  const Dance = icon('dance')
  const Explore = icon('explore')
  const Community = icon('community')
  const About = icon('about')
  const Filter = icon('filter')
  const Clear = icon('clearFilter')
  const DatePicker = icon('datePicker')
  const Fit = icon('fitMap')
  const Locate = icon('locate')
  const Place = icon('place')
  const Time = icon('time')
  const Price = icon('price')
  const AddCalendar = icon('addCalendar')
  const DownloadIcs = icon('download')
  const ShareIcon = icon('share')
  const Directions = icon('directions')
  const Notify = icon('notify')
  const Open = icon('openDetails')
  const nav = [
    { label: 'Dança', Icon: Dance, active: true },
    { label: 'Explorar', Icon: Explore },
    { label: 'Comunidade', Icon: Community },
    { label: 'Sobre', Icon: About },
  ]
  const action = 'inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium'

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Preview title="Barra inferior (celular)">
        <ul className="flex h-16 rounded-lg border border-border bg-surface">
          {nav.map(({ label, Icon, active }) => (
            <li
              key={label}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium ${active ? 'text-brand' : 'text-fg-muted'}`}
            >
              <Glyph icon={Icon} className="size-6" />
              {label}
            </li>
          ))}
        </ul>
      </Preview>

      <Preview title="Menu lateral (computador)">
        <div className="space-y-2 rounded-lg bg-surface-muted p-2">
          <ul className="space-y-1">
            {nav
              .filter(({ label }) => label !== 'Explorar')
              .map(({ label, Icon, active }) => (
                <li
                  key={label}
                  className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                    active ? 'bg-surface text-brand shadow-sm dark:shadow-none' : 'text-fg-muted'
                  }`}
                >
                  <Glyph icon={Icon} className="size-5" />
                  {label}
                </li>
              ))}
          </ul>
          <span className={`${action} w-full justify-center`}>
            <Glyph icon={Locate} className="size-5" />
            Mostrar distâncias
          </span>
        </div>
      </Preview>

      <Preview title="Faixa de dias, filtro e mapa">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-14 w-11 items-center justify-center rounded-lg border border-border bg-surface">
            <Glyph icon={DatePicker} className="size-6" />
          </span>
          <span className="inline-flex h-14 items-center rounded-lg bg-surface px-3 text-sm text-fg-muted">18 · 19 · 20 · 21</span>
          <span className="inline-flex h-14 w-11 items-center justify-center rounded-lg border border-border bg-surface">
            <Glyph icon={Filter} className="size-6" />
          </span>
          <span className="relative inline-flex h-14 w-11 items-center justify-center rounded-lg border border-brand bg-brand text-brand-fg">
            <Glyph icon={Filter} className="size-6" />
            <span className="absolute -top-1 -right-1 inline-flex size-5 items-center justify-center rounded-full bg-genre-red text-xs font-semibold text-genre-red-fg">
              2
            </span>
          </span>
          <span className="inline-flex h-11 items-center gap-1 px-2 text-sm font-medium text-brand">
            <Glyph icon={Clear} className="size-4" />
            Limpar
          </span>
          <span className="inline-flex size-[30px] items-center justify-center rounded border border-border bg-white text-slate-800">
            <Glyph icon={Fit} className="size-4" />
          </span>
        </div>
      </Preview>

      <Preview title="Card do evento">
        <div className="space-y-1.5 rounded-xl bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-lg font-semibold">Milonga de Mis Amores</span>
            <Glyph icon={AddCalendar} className="size-5 shrink-0 text-fg-muted" />
          </div>
          <span className="flex items-center gap-2 text-sm text-fg-muted">
            <Glyph icon={Place} className="size-4" />
            Rua das Escolas Gerais
          </span>
          <span className="flex items-center gap-4 text-sm text-fg-muted">
            <span className="flex items-center gap-2">
              <Glyph icon={Time} className="size-4" />
              20:00 – 23:00
            </span>
            <span className="flex items-center gap-2">
              <Glyph icon={Price} className="size-4" />
              6€
            </span>
          </span>
          <div className="flex items-center justify-between">
            <span className="inline-flex h-7 items-center rounded-full bg-genre-magenta px-3 text-xs font-medium text-genre-magenta-fg">
              Tango
            </span>
            <Glyph icon={Open} className="size-5 text-fg-muted" />
          </div>
        </div>
      </Preview>

      <Preview title="Ações nos detalhes" className="lg:col-span-2">
        <div className="flex flex-wrap gap-2">
          <span className={action}>
            <Glyph icon={AddCalendar} className="size-5" />
            Google Agenda
          </span>
          <span className={action}>
            <Glyph icon={DownloadIcs} className="size-5" />
            Baixar .ics
          </span>
          <span className={action}>
            <Glyph icon={ShareIcon} className="size-5" />
            Compartilhar
          </span>
          <span className={action}>
            <Glyph icon={Directions} className="size-5" />
            Como chegar
          </span>
          <span className={action}>
            <Glyph icon={Notify} className="size-5" />
            Avisar mudanças
          </span>
        </div>
      </Preview>
    </div>
  )
}

/** Desenha um ícone recebido por valor (o lint não confunde com componente criado na renderização). */
function Glyph({ icon, className }: { icon: IconComponent; className: string }) {
  return createElement(icon, { className })
}

function Preview({ title, className = '', children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <figure className={`space-y-2 ${className}`} aria-hidden="true">
      <figcaption className="text-xs font-medium text-fg-muted">{title}</figcaption>
      {children}
    </figure>
  )
}

function IconChoices({
  group,
  value,
  onChange,
  open,
  onToggle,
}: {
  group: Group
  value: number
  onChange: (index: number) => void
  open: boolean
  onToggle: () => void
}) {
  const chosen = group.options[value]
  const Chosen = chosen.icon
  const id = `group-${group.id}`
  return (
    <Card className="p-0">
      <h4>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
        >
          <span>
            <span className="block font-semibold">{group.title}</span>
            <span className="block text-xs text-fg-muted">{group.where}</span>
          </span>
          <span className="ml-auto inline-flex items-center gap-2 text-sm">
            <Chosen className="size-5" />
            <span className="font-mono text-xs">{chosen.name}</span>
          </span>
          <ChevronDown className={`size-5 shrink-0 text-fg-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </h4>
      {open && (
        <div id={id} className="grid gap-2 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
          {group.options.map((option, index) => {
            const Icon = option.icon
            return (
              <button
                key={option.name}
                type="button"
                aria-pressed={index === value}
                onClick={() => onChange(index)}
                className={`relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  index === value ? 'border-brand bg-brand/10' : 'border-border bg-surface hover:bg-surface-muted'
                }`}
              >
                {option.current && (
                  <span className="absolute top-2 right-2 rounded bg-surface-muted px-1.5 text-[10px] font-medium text-fg-muted">
                    atual
                  </span>
                )}
                <Icon className="size-7 shrink-0" />
                <span>
                  <span className="font-mono text-xs font-semibold">{option.name}</span>
                  {option.note && <span className="mt-0.5 block text-xs text-fg-muted">{option.note}</span>}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </Card>
  )
}
