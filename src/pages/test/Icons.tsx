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
  BookOpen,
  Contact,
  Globe,
  Handshake,
  Megaphone,
  MessagesSquare,
  Network,
  Share2,
  Smile,
  Sparkle,
  Users,
  UsersRound,
} from 'lucide-react'
import {
  AddressBookIcon,
  BookOpenTextIcon,
  ChampagneIcon,
  ChatsCircleIcon,
  ConfettiIcon,
  DiscoBallIcon,
  DotsThreeCircleIcon,
  GearIcon,
  GlobeHemisphereWestIcon,
  HandHeartIcon,
  HandshakeIcon,
  HandWavingIcon,
  HeartIcon,
  InfoIcon,
  MegaphoneIcon,
  MusicNotesIcon,
  PersonArmsSpreadIcon,
  PersonSimpleTaiChiIcon,
  QuestionIcon,
  ShareNetworkIcon,
  SmileyIcon,
  SneakerMoveIcon,
  SparkleIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react'
import {
  IconAddressBook,
  IconAffiliate,
  IconBook,
  IconConfetti,
  IconDisc,
  IconDots,
  IconFriends,
  IconHandLoveYou,
  IconHeart,
  IconHeartHandshake,
  IconHelpCircle,
  IconInfoCircle,
  IconInfoSquareRounded,
  IconMessages,
  IconMicrophone2,
  IconMoodHappy,
  IconMusic,
  IconPlaylist,
  IconSettings,
  IconShoe,
  IconSparkles,
  IconSpeakerphone,
  IconUsersGroup,
  IconWorld,
} from '@tabler/icons-react'
import { type ComponentType, type ReactNode, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Segmented } from '../../components/ui/Segmented'
import { siteUrl, useDocumentHead } from '../../seo/useDocumentHead'
import { BackToTest } from './shared'

/** Bibliotecas comparadas. O app usa a lucide-react; outra entraria como dependência nova. */
const LIBS = ['lucide', 'phosphor', 'tabler'] as const
type Lib = (typeof LIBS)[number]
const LIB_LABEL: Record<Lib, string> = { lucide: 'Lucide', phosphor: 'Phosphor', tabler: 'Tabler' }
type IconComponent = ComponentType<{ className?: string }>

/**
 * `current`: o que o app usa hoje (marcado como "atual" e escolhido de início). Sem `lib`, Lucide.
 */
type Option = { name: string; icon: IconComponent; note: string; lib?: Lib; current?: boolean }
type NameOption = { pt: string; en: string; note: string; current?: boolean }

const currentIndex = (options: { current?: boolean }[]) =>
  Math.max(
    0,
    options.findIndex((option) => option.current),
  )

const DANCE: Option[] = [
  { name: 'Music', icon: Music, note: 'Anterior. Genérico: lembra app de música.' },
  { name: 'Footprints', icon: Footprints, note: 'Passos de dança; não confunde com player de música.' },
  { name: 'PartyPopper', icon: PartyPopper, note: 'Festa, evento social.' },
  { name: 'Disc3', icon: Disc3, note: 'Anterior. Vinil / DJ: noite, pista.' },
  { name: 'CalendarHeart', icon: CalendarHeart, note: 'Agenda (o que a tela é) com afeto.' },
  { name: 'CalendarDays', icon: CalendarDays, note: 'Agenda, direto ao ponto.' },
  { name: 'Users', icon: Users, note: 'Pessoas, comunidade, social.' },
  { name: 'HeartHandshake', icon: HeartHandshake, note: 'Dança a dois, parceria.' },
  { name: 'PersonStanding', icon: PersonStanding, note: 'Pessoa; mais neutro.' },
  { name: 'Sparkles', icon: Sparkles, note: 'Brilho, noite especial.' },
  { name: 'Flame', icon: Flame, note: 'Energia, "hot", latino.' },
  { name: 'Music2', icon: Music2, note: 'Variação da nota musical.' },
  { name: 'AudioLines', icon: AudioLines, note: 'Som / ritmo, moderno.' },
  { lib: 'phosphor', name: 'DiscoBall', icon: DiscoBallIcon, note: 'Globo de discoteca: pista e noite, sem parecer player de música.', current: true },
  { lib: 'phosphor', name: 'SneakerMove', icon: SneakerMoveIcon, note: 'Tênis em movimento: dançar.' },
  { lib: 'phosphor', name: 'PersonArmsSpread', icon: PersonArmsSpreadIcon, note: 'Pessoa de braços abertos: alegria, movimento.' },
  { lib: 'phosphor', name: 'PersonSimpleTaiChi', icon: PersonSimpleTaiChiIcon, note: 'Pose em movimento; lembra um passo.' },
  { lib: 'phosphor', name: 'MusicNotes', icon: MusicNotesIcon, note: 'Duas notas: música para dançar.' },
  { lib: 'phosphor', name: 'Confetti', icon: ConfettiIcon, note: 'Festa.' },
  { lib: 'phosphor', name: 'Champagne', icon: ChampagneIcon, note: 'Brinde: social, noite.' },
  { lib: 'phosphor', name: 'Sparkle', icon: SparkleIcon, note: 'Brilho único, mais limpo que Sparkles.' },
  { lib: 'tabler', name: 'IconDisc', icon: IconDisc, note: 'Disco, como o Disc3 atual, com traço Tabler.' },
  { lib: 'tabler', name: 'IconShoe', icon: IconShoe, note: 'Sapato: dança.' },
  { lib: 'tabler', name: 'IconMusic', icon: IconMusic, note: 'Nota musical.' },
  { lib: 'tabler', name: 'IconPlaylist', icon: IconPlaylist, note: 'Lista com nota: agenda + música.' },
  { lib: 'tabler', name: 'IconMicrophone2', icon: IconMicrophone2, note: 'Microfone: DJ, show ao vivo.' },
  { lib: 'tabler', name: 'IconConfetti', icon: IconConfetti, note: 'Festa.' },
  { lib: 'tabler', name: 'IconSparkles', icon: IconSparkles, note: 'Brilho.' },
  { lib: 'tabler', name: 'IconMoodHappy', icon: IconMoodHappy, note: 'Sorriso: diversão.' },
]

const COMMUNITY_ICONS: Option[] = [
  { name: 'UsersRound', icon: UsersRound, note: 'Pessoas: comunidade.', current: true },
  { name: 'Users', icon: Users, note: 'Variação com cabeça redonda menor.' },
  { name: 'HeartHandshake', icon: HeartHandshake, note: 'Apoio, parceria entre a comunidade.' },
  { name: 'Handshake', icon: Handshake, note: 'Parceria, encontro.' },
  { name: 'MessagesSquare', icon: MessagesSquare, note: 'Conversas: grupos do WhatsApp.' },
  { name: 'Megaphone', icon: Megaphone, note: 'Divulgação, avisos.' },
  { name: 'Globe', icon: Globe, note: 'Outros sites e calendários.' },
  { name: 'Contact', icon: Contact, note: 'Contatos: perfis e grupos.' },
  { name: 'Network', icon: Network, note: 'Rede de comunidades.' },
  { name: 'Share2', icon: Share2, note: 'Conexões, compartilhar.' },
  { lib: 'phosphor', name: 'UsersThree', icon: UsersThreeIcon, note: 'Três pessoas: grupo, comunidade.' },
  { lib: 'phosphor', name: 'ChatsCircle', icon: ChatsCircleIcon, note: 'Conversas: grupos.' },
  { lib: 'phosphor', name: 'Handshake', icon: HandshakeIcon, note: 'Parceria.' },
  { lib: 'phosphor', name: 'HandHeart', icon: HandHeartIcon, note: 'Cuidado, comunidade.' },
  { lib: 'phosphor', name: 'Megaphone', icon: MegaphoneIcon, note: 'Divulgação.' },
  { lib: 'phosphor', name: 'GlobeHemisphereWest', icon: GlobeHemisphereWestIcon, note: 'Mundo (com a Europa/Atlântico).' },
  { lib: 'phosphor', name: 'AddressBook', icon: AddressBookIcon, note: 'Agenda de contatos.' },
  { lib: 'phosphor', name: 'ShareNetwork', icon: ShareNetworkIcon, note: 'Rede.' },
  { lib: 'tabler', name: 'IconUsersGroup', icon: IconUsersGroup, note: 'Grupo de três: comunidade.' },
  { lib: 'tabler', name: 'IconFriends', icon: IconFriends, note: 'Duas pessoas lado a lado: amizade, par.' },
  { lib: 'tabler', name: 'IconMessages', icon: IconMessages, note: 'Conversas: grupos.' },
  { lib: 'tabler', name: 'IconHeartHandshake', icon: IconHeartHandshake, note: 'Apoio, parceria.' },
  { lib: 'tabler', name: 'IconAffiliate', icon: IconAffiliate, note: 'Rede ligada.' },
  { lib: 'tabler', name: 'IconWorld', icon: IconWorld, note: 'Outros sites.' },
  { lib: 'tabler', name: 'IconAddressBook', icon: IconAddressBook, note: 'Contatos.' },
  { lib: 'tabler', name: 'IconSpeakerphone', icon: IconSpeakerphone, note: 'Divulgação.' },
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
  { name: 'Info', icon: Info, note: 'Anterior. Combina com "Info" e "Sobre".' },
  { name: 'Ellipsis', icon: Ellipsis, note: 'Combina com "Mais".' },
  { name: 'CircleEllipsis', icon: CircleEllipsis, note: '"Mais" com o mesmo peso visual dos outros.' },
  { name: 'Menu', icon: Menu, note: 'Combina com "Menu".' },
  { name: 'Settings', icon: Settings, note: 'Combina com "Ajustes".' },
  { name: 'SunMoon', icon: SunMoon, note: 'Tema; combina com "Ajustes".' },
  { name: 'CircleUserRound', icon: CircleUserRound, note: 'Conta/perfil (o app não tem login).' },
  { name: 'CircleHelp', icon: CircleHelp, note: 'Ajuda / dúvidas.' },
  { name: 'Heart', icon: Heart, note: 'Sobre / quem faz.' },
  { name: 'BookOpen', icon: BookOpen, note: 'Sobre / leia mais.' },
  { name: 'Smile', icon: Smile, note: 'Amigável, "olá".' },
  { name: 'Sparkle', icon: Sparkle, note: 'O app em si.' },
  { lib: 'phosphor', name: 'Info', icon: InfoIcon, note: 'Info no traço Phosphor.', current: true },
  { lib: 'phosphor', name: 'Question', icon: QuestionIcon, note: 'Ajuda.' },
  { lib: 'phosphor', name: 'BookOpenText', icon: BookOpenTextIcon, note: 'Sobre / leia mais.' },
  { lib: 'phosphor', name: 'DotsThreeCircle', icon: DotsThreeCircleIcon, note: '"Mais".' },
  { lib: 'phosphor', name: 'Gear', icon: GearIcon, note: 'Ajustes.' },
  { lib: 'phosphor', name: 'HandWaving', icon: HandWavingIcon, note: 'Aceno: "olá", quem somos.' },
  { lib: 'phosphor', name: 'Heart', icon: HeartIcon, note: 'Feito com carinho.' },
  { lib: 'phosphor', name: 'Smiley', icon: SmileyIcon, note: 'Amigável.' },
  { lib: 'tabler', name: 'IconInfoCircle', icon: IconInfoCircle, note: 'Info no traço Tabler.' },
  { lib: 'tabler', name: 'IconInfoSquareRounded', icon: IconInfoSquareRounded, note: 'Info em quadrado arredondado.' },
  { lib: 'tabler', name: 'IconHelpCircle', icon: IconHelpCircle, note: 'Ajuda.' },
  { lib: 'tabler', name: 'IconDots', icon: IconDots, note: '"Mais".' },
  { lib: 'tabler', name: 'IconSettings', icon: IconSettings, note: 'Ajustes.' },
  { lib: 'tabler', name: 'IconHeart', icon: IconHeart, note: 'Feito com carinho.' },
  { lib: 'tabler', name: 'IconBook', icon: IconBook, note: 'Sobre / leia mais.' },
  { lib: 'tabler', name: 'IconHandLoveYou', icon: IconHandLoveYou, note: 'Mão "amo você": comunidade, carinho.' },
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

const libOf = (option: Option): Lib => option.lib ?? 'lucide'
const nameOf = (options: Option[], index: number) => `${options[index].name} (${LIB_LABEL[libOf(options[index])]})`
const keyOf = (option: Option) => `${libOf(option)}:${option.name}`

/**
 * Página de teste (/teste/icones, pública mas sem link no app): opções de ícone para "Dança" e para
 * o botão de filtro, e de nome e ícone para "Info", com prévia na barra inferior, no menu lateral e
 * no botão de filtro.
 */
export default function Icons() {
  useDocumentHead({
    title: 'Ícones (teste)',
    description: 'Sugestões de ícones e nomes',
    canonical: `${siteUrl()}teste/icones`,
    noindex: true,
  })
  const [dance, setDance] = useState(() => currentIndex(DANCE))
  const [filter, setFilter] = useState(() => currentIndex(FILTER))
  const [infoName, setInfoName] = useState(() => currentIndex(INFO_NAMES))
  const [infoIcon, setInfoIcon] = useState(() => currentIndex(INFO_ICONS))
  const [mapName, setMapName] = useState(() => currentIndex(MAP_NAMES))
  const [mapIcon, setMapIcon] = useState(() => currentIndex(MAP_ICONS))
  const [communityIcon, setCommunityIcon] = useState(() => currentIndex(COMMUNITY_ICONS))
  // Filtro por biblioteca nas listas de opções (a escolhida continua na prévia).
  const [lib, setLib] = useState<Lib | 'all'>('all')
  const [copied, setCopied] = useState(false)
  // Acordeon: um grupo de opções aberto por vez (fechado, mostra só a escolha).
  const [openGroup, setOpenGroup] = useState<string | null>('dance')
  const toggle = (group: string) => () => setOpenGroup((current) => (current === group ? null : group))

  const nav = [
    { label: 'Dança', icon: DANCE[dance].icon, active: true },
    { label: MAP_NAMES[mapName].pt, icon: MAP_ICONS[mapIcon].icon, active: false },
    { label: 'Comunidade', icon: COMMUNITY_ICONS[communityIcon].icon, active: false },
    { label: INFO_NAMES[infoName].pt, icon: INFO_ICONS[infoIcon].icon, active: false },
  ]
  const FilterIcon = FILTER[filter].icon

  const copy = async () => {
    await navigator.clipboard.writeText(
      [
        `Dança: ${nameOf(DANCE, dance)}`,
        `Filtro: ${nameOf(FILTER, filter)}`,
        `Mapa: "${MAP_NAMES[mapName].pt}" / "${MAP_NAMES[mapName].en}", ícone ${nameOf(MAP_ICONS, mapIcon)}`,
        `Comunidade: ${nameOf(COMMUNITY_ICONS, communityIcon)}`,
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
            Clique numa opção para ver na prévia. O app usa a Lucide; Phosphor e Tabler entram para comparar (usar uma delas no app seria
            uma dependência nova, e misturar estilos de traço entre os ícones do menu fica desigual).
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

        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Biblioteca"
            options={[{ value: 'all' as const, label: 'Todas' }, ...LIBS.map((value) => ({ value, label: LIB_LABEL[value] }))]}
            value={lib}
            onChange={setLib}
          />
          <Button onClick={copy}>
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? 'Copiado' : 'Copiar escolha'}
          </Button>
        </div>
      </Card>

      <IconChoices
        lib={lib}
        title="Ícone de Dança"
        options={DANCE}
        value={dance}
        onChange={setDance}
        open={openGroup === 'dance'}
        onToggle={toggle('dance')}
      />
      <IconChoices
        lib={lib}
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
      <IconChoices
        lib={lib}
        title="Ícone do Mapa"
        options={MAP_ICONS}
        value={mapIcon}
        onChange={setMapIcon}
        open={openGroup === 'mapIcon'}
        onToggle={toggle('mapIcon')}
      />
      <IconChoices
        lib={lib}
        title="Ícone de Comunidade"
        options={COMMUNITY_ICONS}
        value={communityIcon}
        onChange={setCommunityIcon}
        open={openGroup === 'communityIcon'}
        onToggle={toggle('communityIcon')}
      />
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
        lib={lib}
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

function IconChoices({ title, options, value, onChange, open, onToggle, lib }: ChoicesProps<Option> & { lib: Lib | 'all' }) {
  const chosen = options[value]
  const { icon: Chosen, name: chosenName } = chosen
  return (
    <Accordion
      title={title}
      chosen={
        <>
          <Chosen className="size-5" aria-hidden="true" />
          <span className="font-mono text-xs">{chosenName}</span>
          <LibTag lib={libOf(chosen)} />
        </>
      }
      open={open}
      onToggle={onToggle}
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option, index) => {
          if (lib !== 'all' && libOf(option) !== lib) return null
          const { name, icon: Icon, note, current } = option
          return (
            <ChoiceButton key={keyOf(option)} selected={index === value} onClick={() => onChange(index)} current={!!current}>
              <span className="flex items-start gap-3">
                <Icon className="size-7 shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-mono text-xs font-semibold">{name}</span> <LibTag lib={libOf(option)} />
                  <span className="mt-0.5 block text-xs text-fg-muted">{note}</span>
                </span>
              </span>
            </ChoiceButton>
          )
        })}
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
      {current && (
        <span className="absolute top-2 right-2 rounded bg-surface-muted px-1.5 text-[10px] font-medium text-fg-muted">atual</span>
      )}
      {children}
    </button>
  )
}

/** Selo da biblioteca do ícone. */
function LibTag({ lib }: { lib: Lib }) {
  return (
    <span className="rounded bg-surface-muted px-1.5 py-0.5 align-middle font-sans text-[10px] font-medium text-fg-muted">
      {LIB_LABEL[lib]}
    </span>
  )
}
