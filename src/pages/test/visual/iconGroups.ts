// Opções de ícone de /teste/icones: um grupo por ícone do app, com o atual marcado.
import {
  AlarmClock,
  ArrowRight,
  Banknote,
  BellPlus,
  BellRing,
  BookOpen,
  Bookmark,
  Building2,
  Calendar,
  CalendarArrowDown,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CalendarSearch,
  ChevronRight,
  CircleHelp,
  CircleX,
  Clock,
  Compass,
  Crosshair,
  Disc3,
  Download,
  Euro,
  Eraser,
  FileDown,
  Focus,
  Footprints,
  Funnel,
  FunnelX,
  Globe,
  Heart,
  HeartHandshake,
  Info,
  Landmark,
  ListFilter,
  Locate,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  MapPinCheck,
  MapPinned,
  Maximize,
  Megaphone,
  MessagesSquare,
  Music,
  Navigation,
  Palette,
  PartyPopper,
  Radar,
  RotateCcw,
  Route,
  Scan,
  Send,
  Share,
  Share2,
  Signpost,
  SlidersHorizontal,
  Sparkles,
  Tags,
  Ticket,
  Timer,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react'
import type { ComponentType } from 'react'

export type IconComponent = ComponentType<{ className?: string }>

/** `current`: o que o app usa hoje (marcado como "atual" e escolhido de início). */
type Option = { name: string; icon: IconComponent; note?: string; current?: boolean }

const lu = (icon: IconComponent, name: string, note?: string, current?: boolean): Option => ({
  name,
  icon,
  ...(note ? { note } : {}),
  ...(current ? { current } : {}),
})

export type GroupId =
  | 'dance'
  | 'explore'
  | 'community'
  | 'about'
  | 'filter'
  | 'clearFilter'
  | 'datePicker'
  | 'fitMap'
  | 'locate'
  | 'place'
  | 'time'
  | 'price'
  | 'addCalendar'
  | 'download'
  | 'share'
  | 'directions'
  | 'notify'
  | 'openDetails'

export type Group = { id: GroupId; section: string; title: string; where: string; options: Option[] }

export const GROUPS: Group[] = [
  // ---- Menu
  {
    id: 'dance',
    section: 'Menu',
    title: 'Dança',
    where: 'Barra inferior e menu lateral.',
    options: [
      lu(Disc3, 'Disc3', 'Vinil / DJ.'),
      lu(Music, 'Music', 'Lembra app de música.'),
      lu(Footprints, 'Footprints', 'Passos.', true),
      lu(PartyPopper, 'PartyPopper', 'Festa.'),
      lu(Sparkles, 'Sparkles'),
    ],
  },
  {
    id: 'explore',
    section: 'Menu',
    title: 'Explorar (mapa)',
    where: 'Barra inferior, só no celular e tablet.',
    options: [
      lu(Compass, 'Compass', 'Bússola: explorar.', true),
      lu(MapIcon, 'Map'),
      lu(MapPinned, 'MapPinned'),
      lu(Navigation, 'Navigation'),
      lu(Radar, 'Radar', 'Por perto.'),
    ],
  },
  {
    id: 'community',
    section: 'Menu',
    title: 'Comunidade',
    where: 'Barra inferior e menu lateral.',
    options: [
      lu(UsersRound, 'UsersRound', 'Pessoas.', true),
      lu(Users, 'Users'),
      lu(HeartHandshake, 'HeartHandshake', 'Parceria.'),
      lu(MessagesSquare, 'MessagesSquare', 'Conversas (WhatsApp).'),
      lu(Megaphone, 'Megaphone'),
      lu(Globe, 'Globe', 'Outros sites.'),
    ],
  },
  {
    id: 'about',
    section: 'Menu',
    title: 'Sobre',
    where: 'Barra inferior e menu lateral.',
    options: [lu(Info, 'Info', undefined, true), lu(CircleHelp, 'CircleHelp'), lu(BookOpen, 'BookOpen'), lu(Heart, 'Heart', 'Quem faz.')],
  },
  // ---- Agenda e mapa
  {
    id: 'filter',
    section: 'Agenda e mapa',
    title: 'Filtro de estilos',
    where: 'Botão ao lado da faixa de dias.',
    options: [
      lu(Funnel, 'Funnel', 'Funil: o mais reconhecido.', true),
      lu(SlidersHorizontal, 'SlidersHorizontal'),
      lu(ListFilter, 'ListFilter'),
      lu(Tags, 'Tags', 'Estilos como etiquetas.'),
      lu(Palette, 'Palette', 'Cada estilo tem uma cor.'),
    ],
  },
  {
    id: 'clearFilter',
    section: 'Agenda e mapa',
    title: 'Limpar filtros',
    where: '"Limpar" no popover e no drawer de filtros.',
    options: [
      lu(FunnelX, 'FunnelX', 'Funil com X.', true),
      lu(RotateCcw, 'RotateCcw', 'Voltar ao início.'),
      lu(Eraser, 'Eraser'),
      lu(CircleX, 'CircleX'),
    ],
  },
  {
    id: 'datePicker',
    section: 'Agenda e mapa',
    title: 'Escolher data',
    where: 'Botão no começo da faixa de dias.',
    options: [
      lu(CalendarDays, 'CalendarDays', 'Calendário com dias.'),
      lu(Calendar, 'Calendar'),
      lu(CalendarSearch, 'CalendarSearch', 'Procurar data.', true),
    ],
  },
  {
    id: 'fitMap',
    section: 'Agenda e mapa',
    title: 'Enquadrar mapa',
    where: 'Botão no canto do mapa.',
    options: [lu(Focus, 'Focus', 'Mira com cantos.', true), lu(Maximize, 'Maximize'), lu(Scan, 'Scan'), lu(Crosshair, 'Crosshair')],
  },
  {
    id: 'locate',
    section: 'Agenda e mapa',
    title: 'Distâncias (minha localização)',
    where: '"Mostrar distâncias", no fim da barra lateral e no drawer.',
    options: [lu(LocateFixed, 'LocateFixed', 'Mira de localização.', true), lu(Locate, 'Locate'), lu(MapPinCheck, 'MapPinCheck')],
  },
  // ---- Card e detalhes
  {
    id: 'place',
    section: 'Card e detalhes',
    title: 'Local',
    where: 'Card e detalhes do evento.',
    options: [lu(MapPin, 'MapPin', 'Pino: o padrão.', true), lu(Building2, 'Building2', 'Prédio.'), lu(Landmark, 'Landmark')],
  },
  {
    id: 'time',
    section: 'Card e detalhes',
    title: 'Horário',
    where: 'Card e detalhes do evento.',
    options: [lu(Clock, 'Clock', 'Relógio.', true), lu(Timer, 'Timer'), lu(AlarmClock, 'AlarmClock')],
  },
  {
    id: 'price',
    section: 'Card e detalhes',
    title: 'Preço',
    where: 'Card e detalhes do evento.',
    options: [lu(Ticket, 'Ticket', 'Bilhete: entrada.', true), lu(Euro, 'Euro'), lu(Wallet, 'Wallet'), lu(Banknote, 'Banknote')],
  },
  {
    id: 'addCalendar',
    section: 'Card e detalhes',
    title: 'Adicionar ao calendário',
    where: 'Canto do card e botão nos detalhes.',
    options: [
      lu(CalendarPlus, 'CalendarPlus', 'Calendário com +.', true),
      lu(CalendarCheck, 'CalendarCheck'),
      lu(Bookmark, 'Bookmark', 'Guardar.'),
    ],
  },
  {
    id: 'download',
    section: 'Card e detalhes',
    title: 'Baixar .ics',
    where: 'Detalhes do evento (Apple, Outlook).',
    options: [
      lu(Download, 'Download', 'Seta para baixo.'),
      lu(FileDown, 'FileDown'),
      lu(CalendarArrowDown, 'CalendarArrowDown', 'Calendário com seta.', true),
    ],
  },
  {
    id: 'share',
    section: 'Card e detalhes',
    title: 'Compartilhar',
    where: 'Detalhes do evento.',
    options: [lu(Share2, 'Share2', 'Três pontos ligados.', true), lu(Share, 'Share', 'Caixa com seta (padrão iOS).'), lu(Send, 'Send')],
  },
  {
    id: 'directions',
    section: 'Card e detalhes',
    title: 'Como chegar',
    where: 'Detalhes do evento (abre o app de mapas).',
    options: [lu(Navigation, 'Navigation', 'Seta de navegação.', true), lu(Route, 'Route'), lu(Signpost, 'Signpost')],
  },
  {
    id: 'notify',
    section: 'Card e detalhes',
    title: 'Aviso de mudanças',
    where: 'Detalhes e o aviso no topo da lista.',
    options: [lu(BellRing, 'BellRing', 'Sino tocando.'), lu(BellPlus, 'BellPlus', undefined, true)],
  },
  {
    id: 'openDetails',
    section: 'Card e detalhes',
    title: 'Abrir detalhes',
    where: 'Canto do card.',
    options: [lu(ChevronRight, 'ChevronRight', 'Seta fina.', true), lu(ArrowRight, 'ArrowRight')],
  },
]

export const SECTIONS = [...new Set(GROUPS.map((group) => group.section))]
export const currentIndex = (options: Option[]) =>
  Math.max(
    0,
    options.findIndex((option) => option.current),
  )
