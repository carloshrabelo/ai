import {
  AudioLines,
  CalendarDays,
  CalendarHeart,
  Check,
  ChevronDown,
  CircleEllipsis,
  CircleHelp,
  CircleUserRound,
  Compass,
  Copy,
  Disc3,
  Ellipsis,
  Flame,
  Footprints,
  Funnel,
  Heart,
  HeartHandshake,
  Earth,
  Info,
  LocateFixed,
  ListFilter,
  type LucideIcon,
  Map as MapIcon,
  MapPin,
  MapPinned,
  Menu,
  Music,
  Navigation,
  Music2,
  Palette,
  PartyPopper,
  PersonStanding,
  Radar,
  Route,
  Settings,
  Settings2,
  Shapes,
  Signpost,
  SlidersHorizontal,
  SlidersVertical,
  Sparkles,
  SunMoon,
  Tags,
  Users,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { siteUrl, useDocumentHead } from '../../seo/useDocumentHead'
import { BackToTest } from './shared'

/** `current`: o que o app usa hoje (marcado como "atual" e escolhido de início). */
type Option = { name: string; icon: LucideIcon; note: string; current?: boolean }
type NameOption = { pt: string; en: string; note: string; current?: boolean }

const currentIndex = (options: { current?: boolean }[]) => Math.max(0, options.findIndex((option) => option.current))

const DANCE: Option[] = [
  { name: 'Music', icon: Music, note: 'Anterior. Genérico: lembra app de música.' },
  { name: 'Footprints', icon: Footprints, note: 'Passos de dança; não confunde com player de música.' },
  { name: 'PartyPopper', icon: PartyPopper, note: 'Festa, evento social.' },
  { name: 'Disc3', icon: Disc3, note: 'Vinil / DJ: noite, pista.', current: true },
  { name: 'CalendarHeart', icon: CalendarHeart, note: 'Agenda (o que a tela é) com afeto.' },
  { name: 'CalendarDays', icon: CalendarDays, note: 'Agenda, direto ao ponto.' },
  { name: 'Users', icon: Users, note: 'Pessoas, comunidade, social.' },
  { name: 'HeartHandshake', icon: HeartHandshake, note: 'Dança a dois, parceria.' },
  { name: 'PersonStanding', icon: PersonStanding, note: 'Pessoa; mais neutro.' },
  { name: 'Sparkles', icon: Sparkles, note: 'Brilho, noite especial.' },
  { name: 'Flame', icon: Flame, note: 'Energia, "hot", latino.' },
  { name: 'Music2', icon: Music2, note: 'Variação da nota musical.' },
  { name: 'AudioLines', icon: AudioLines, note: 'Som / ritmo, moderno.' },
]

const FILTER: Option[] = [
  { name: 'SlidersHorizontal', icon: SlidersHorizontal, note: 'Anterior. Padrão de "ajustes de filtro".' },
  { name: 'Funnel', icon: Funnel, note: 'Funil: o símbolo mais reconhecido de filtro.', current: true },
  { name: 'ListFilter', icon: ListFilter, note: 'Filtro de lista, mais leve.' },
  { name: 'SlidersVertical', icon: SlidersVertical, note: 'Variação vertical do atual.' },
  { name: 'Tags', icon: Tags, note: 'Estilos como etiquetas (o filtro é por estilo).' },
  { name: 'Palette', icon: Palette, note: 'Cada estilo tem uma cor.' },
  { name: 'Shapes', icon: Shapes, note: 'Categorias / tipos.' },
  { name: 'Settings2', icon: Settings2, note: 'Ajustes; menos claro como filtro.' },
]

const INFO_NAMES: NameOption[] = [
  { pt: 'Info', en: 'Info', note: 'Anterior. Curto, mas vago.' },
  { pt: 'Mais', en: 'More', note: 'Padrão de apps para "o resto": sobre, tema, idioma, instalar.' },
  { pt: 'Ajustes', en: 'Settings', note: 'O que a tela mais tem: tema, idioma, instalar.' },
  { pt: 'Sobre', en: 'About', note: 'Foca no texto sobre o app e o calendário.', current: true },
  { pt: 'Menu', en: 'Menu', note: 'Genérico; combina com o ícone de menu.' },
  { pt: 'App', en: 'App', note: 'Tudo sobre o app (versão, instalar, tema).' },
]

const INFO_ICONS: Option[] = [
  { name: 'Info', icon: Info, note: 'Combina com "Info" e "Sobre".', current: true },
  { name: 'Ellipsis', icon: Ellipsis, note: 'Combina com "Mais".' },
  { name: 'CircleEllipsis', icon: CircleEllipsis, note: '"Mais" com o mesmo peso visual dos outros.' },
  { name: 'Menu', icon: Menu, note: 'Combina com "Menu".' },
  { name: 'Settings', icon: Settings, note: 'Combina com "Ajustes".' },
  { name: 'SunMoon', icon: SunMoon, note: 'Tema; combina com "Ajustes".' },
  { name: 'CircleUserRound', icon: CircleUserRound, note: 'Conta/perfil (o app não tem login).' },
  { name: 'CircleHelp', icon: CircleHelp, note: 'Ajuda / dúvidas.' },
  { name: 'Heart', icon: Heart, note: 'Sobre / quem faz.' },
]

const MAP_NAMES: NameOption[] = [
  { pt: 'Mapa', en: 'Map', note: 'Anterior. Direto: o que a tela é.' },
  { pt: 'Perto', en: 'Nearby', note: 'Foca no uso: o que tem perto de mim.' },
  { pt: 'Onde', en: 'Where', note: 'Curto; pergunta que o mapa responde.' },
  { pt: 'Locais', en: 'Venues', note: 'Os lugares dos eventos do dia.' },
  { pt: 'Explorar', en: 'Explore', note: 'Convite a descobrir; mais vago.', current: true },
]

const MAP_ICONS: Option[] = [
  { name: 'Map', icon: MapIcon, note: 'Anterior. Mapa dobrado: o padrão.' },
  { name: 'MapPinned', icon: MapPinned, note: 'Mapa com pino: lugares dos eventos.' },
  { name: 'MapPin', icon: MapPin, note: 'Só o pino: local, endereço.' },
  { name: 'Compass', icon: Compass, note: 'Bússola: explorar, orientar-se.', current: true },
  { name: 'Navigation', icon: Navigation, note: 'Seta de navegação: "ir até lá".' },
  { name: 'LocateFixed', icon: LocateFixed, note: 'Mira: minha localização, perto de mim.' },
  { name: 'Earth', icon: Earth, note: 'Globo; amplo demais para uma cidade.' },
  { name: 'Route', icon: Route, note: 'Rota entre pontos: como chegar.' },
  { name: 'Signpost', icon: Signpost, note: 'Placa de direção: onde ir.' },
  { name: 'Radar', icon: Radar, note: 'Radar: o que acontece por perto.' },
]

const nameOf = (options: Option[], index: number) => options[index].name

/**
 * Página de teste (/teste/icones, pública mas sem link no app): opções de ícone para "Dança" e para
 * o botão de filtro, e de nome e ícone para "Info", com prévia na barra inferior, no menu lateral e
 * no botão de filtro.
 */
export default function Icons() {
  useDocumentHead({ title: 'Ícones (teste)', description: 'Sugestões de ícones e nomes', canonical: `${siteUrl()}teste/icones`, noindex: true })
  const [dance, setDance] = useState(() => currentIndex(DANCE))
  const [filter, setFilter] = useState(() => currentIndex(FILTER))
  const [infoName, setInfoName] = useState(() => currentIndex(INFO_NAMES))
  const [infoIcon, setInfoIcon] = useState(() => currentIndex(INFO_ICONS))
  const [mapName, setMapName] = useState(() => currentIndex(MAP_NAMES))
  const [mapIcon, setMapIcon] = useState(() => currentIndex(MAP_ICONS))
  const [copied, setCopied] = useState(false)
  // Acordeon: um grupo de opções aberto por vez (fechado, mostra só a escolha).
  const [openGroup, setOpenGroup] = useState<string | null>('dance')
  const toggle = (group: string) => () => setOpenGroup((current) => (current === group ? null : group))

  const nav = [
    { label: 'Dança', icon: DANCE[dance].icon, active: true },
    { label: MAP_NAMES[mapName].pt, icon: MAP_ICONS[mapIcon].icon, active: false },
    { label: INFO_NAMES[infoName].pt, icon: INFO_ICONS[infoIcon].icon, active: false },
  ]
  const FilterIcon = FILTER[filter].icon

  const copy = async () => {
    await navigator.clipboard.writeText(
      [
        `Dança: ${nameOf(DANCE, dance)}`,
        `Filtro: ${nameOf(FILTER, filter)}`,
        `Mapa: "${MAP_NAMES[mapName].pt}" / "${MAP_NAMES[mapName].en}", ícone ${nameOf(MAP_ICONS, mapIcon)}`,
        `Info: "${INFO_NAMES[infoName].pt}" / "${INFO_NAMES[infoName].en}", ícone ${nameOf(INFO_ICONS, infoIcon)}`,
      ].join('\n'),
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <BackToTest />
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Ícones e nomes</h2>
          <p className="text-sm text-fg-muted">
            Clique numa opção para ver na prévia. Ícones do lucide-react (o mesmo pacote do app).
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <Preview title="Barra inferior (celular)">
            <ul className="flex h-16 rounded-lg border border-border bg-surface">
              {nav.map(({ label, icon: Icon, active }) => (
                <li
                  key={label}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium ${active ? 'text-brand' : 'text-fg-muted'}`}
                >
                  <Icon className="size-6" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </Preview>
          <Preview title="Menu lateral (computador)">
            <ul className="w-52 space-y-1 rounded-lg bg-surface-muted p-2">
              {nav
                .filter((_, index) => index !== 1) // o mapa só aparece na barra inferior
                .map(({ label, icon: Icon, active }) => (
                  <li
                    key={label}
                    className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                      active ? 'bg-surface text-brand shadow-sm dark:shadow-none' : 'text-fg-muted'
                    }`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {label}
                  </li>
                ))}
            </ul>
          </Preview>
          <Preview title="Filtro (fechado, aberto, com 2)">
            <div className="flex gap-3">
              {[
                { open: false, count: 0 },
                { open: true, count: 0 },
                { open: false, count: 2 },
              ].map(({ open, count }) => (
                <span
                  key={`${open}${count}`}
                  className={`relative inline-flex h-14 w-11 items-center justify-center rounded-lg border ${
                    open ? 'border-brand bg-brand text-brand-fg' : 'border-border bg-surface text-fg'
                  }`}
                >
                  <FilterIcon className="size-6" aria-hidden="true" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex size-5 items-center justify-center rounded-full bg-genre-red text-xs font-semibold text-genre-red-fg">
                      {count}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </Preview>
        </div>

        <Button onClick={copy}>
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? 'Copiado' : 'Copiar escolha'}
        </Button>
      </Card>

      <IconChoices title="Ícone de Dança" options={DANCE} value={dance} onChange={setDance} open={openGroup === 'dance'} onToggle={toggle('dance')} />
      <IconChoices
        title="Ícone do filtro de estilos"
        options={FILTER}
        value={filter}
        onChange={setFilter}
        open={openGroup === 'filter'}
        onToggle={toggle('filter')}
      />
      <NameChoices
        title="Nome do Mapa"
        hint="Aba só do celular e tablet: mapa do dia com os eventos num carrossel."
        options={MAP_NAMES}
        value={mapName}
        onChange={setMapName}
        open={openGroup === 'mapName'}
        onToggle={toggle('mapName')}
      />
      <IconChoices title="Ícone do Mapa" options={MAP_ICONS} value={mapIcon} onChange={setMapIcon} open={openGroup === 'mapIcon'} onToggle={toggle('mapIcon')} />
      <NameChoices
        title="Nome de Sobre (antes Info)"
        hint="A tela tem: sobre o app e o calendário, tema, idioma, conexão, instalar e versão."
        options={INFO_NAMES}
        value={infoName}
        onChange={setInfoName}
        open={openGroup === 'infoName'}
        onToggle={toggle('infoName')}
      />
      <IconChoices
        title="Ícone de Sobre"
        options={INFO_ICONS}
        value={infoIcon}
        onChange={setInfoIcon}
        open={openGroup === 'infoIcon'}
        onToggle={toggle('infoIcon')}
      />
    </section>
  )
}

function Preview({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="space-y-2">
      <figcaption className="text-xs font-medium text-fg-muted">{title}</figcaption>
      {children}
    </figure>
  )
}

/** Grupo de opções que abre e fecha; fechado, mostra só o título e a opção escolhida. */
function Accordion({
  title,
  chosen,
  open,
  onToggle,
  children,
}: {
  title: string
  chosen: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const id = `group-${title.replace(/\W+/g, '-')}`
  return (
    <Card className="p-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
        >
          <span className="font-semibold">{title}</span>
          <span className="ml-auto inline-flex items-center gap-2 text-sm">{chosen}</span>
          <ChevronDown className={`size-5 shrink-0 text-fg-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </h3>
      {open && (
        <div id={id} className="space-y-3 border-t border-border p-4">
          {children}
        </div>
      )}
    </Card>
  )
}

type ChoicesProps<T> = {
  title: string
  options: T[]
  value: number
  onChange: (index: number) => void
  open: boolean
  onToggle: () => void
}

function NameChoices({ title, hint, options, value, onChange, open, onToggle }: ChoicesProps<NameOption> & { hint: string }) {
  return (
    <Accordion title={title} chosen={<span className="font-semibold">{options[value].pt}</span>} open={open} onToggle={onToggle}>
      <p className="text-sm text-fg-muted">{hint}</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option, index) => (
          <ChoiceButton key={option.pt} selected={index === value} onClick={() => onChange(index)} current={!!option.current}>
            <span className="font-semibold">{option.pt}</span>
            <span className="text-fg-muted"> / {option.en}</span>
            <span className="mt-1 block text-xs text-fg-muted">{option.note}</span>
          </ChoiceButton>
        ))}
      </div>
    </Accordion>
  )
}

function IconChoices({ title, options, value, onChange, open, onToggle }: ChoicesProps<Option>) {
  const { icon: Chosen, name: chosenName } = options[value]
  return (
    <Accordion
      title={title}
      chosen={
        <>
          <Chosen className="size-5" aria-hidden="true" />
          <span className="font-mono text-xs">{chosenName}</span>
        </>
      }
      open={open}
      onToggle={onToggle}
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map(({ name, icon: Icon, note, current }, index) => (
          <ChoiceButton key={name} selected={index === value} onClick={() => onChange(index)} current={!!current}>
            <span className="flex items-start gap-3">
              <Icon className="size-7 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-mono text-xs font-semibold">{name}</span>
                <span className="mt-0.5 block text-xs text-fg-muted">{note}</span>
              </span>
            </span>
          </ChoiceButton>
        ))}
      </div>
    </Accordion>
  )
}

function ChoiceButton({
  selected,
  current,
  onClick,
  children,
}: {
  selected: boolean
  current: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative cursor-pointer rounded-lg border p-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        selected ? 'border-brand bg-brand/10' : 'border-border bg-surface hover:bg-surface-muted'
      }`}
    >
      {current && <span className="absolute top-2 right-2 rounded bg-surface-muted px-1.5 text-[10px] font-medium text-fg-muted">atual</span>}
      {children}
    </button>
  )
}
