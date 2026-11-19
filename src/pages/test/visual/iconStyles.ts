// Os ícones escolhidos (Lucide, em iconGroups.ts) em estilos cheios, mais perto do visual do
// Duolingo: Phosphor Fill, Phosphor Duotone (duas tonalidades) e Fluent Filled (Microsoft). Ícones
// importados um a um (as bibliotecas inteiras são grandes demais para o cache do PWA).
import {
  CalendarArrowDown24Filled,
  CalendarAdd24Filled,
  CalendarSearch20Filled,
  ChevronRight24Filled,
  Clock24Filled,
  CompassNorthwest24Filled,
  Directions24Filled,
  Filter24Filled,
  FilterDismiss24Filled,
  Info24Filled,
  Location24Filled,
  MyLocation24Filled,
  PeopleCommunity24Filled,
  PersonWalking24Filled,
  ScanDash24Filled,
  Share24Filled,
  AlertOn24Filled,
  TicketDiagonal24Filled,
} from '@fluentui/react-icons'
import {
  BellRingingIcon,
  CalendarDotsIcon,
  CalendarPlusIcon,
  CaretRightIcon,
  ClockIcon,
  CompassIcon,
  DownloadSimpleIcon,
  FootprintsIcon,
  FrameCornersIcon,
  FunnelIcon,
  FunnelXIcon,
  GpsFixIcon,
  type Icon as PhosphorIcon,
  type IconWeight,
  InfoIcon,
  MapPinIcon,
  NavigationArrowIcon,
  ShareNetworkIcon,
  TicketIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react'
import { type ComponentType, createElement } from 'react'
import type { GroupId, IconComponent } from './iconGroups'

export const ICON_STYLES = [
  { id: 'lucide', label: 'Lucide (atual)', note: 'Traço de 2px, o que o app usa.' },
  { id: 'phosphorFill', label: 'Phosphor Fill', note: 'Cheio e arredondado.' },
  { id: 'phosphorDuotone', label: 'Phosphor Duotone', note: 'Duas tonalidades (a segunda em 20%), bem lúdico.' },
  { id: 'fluent', label: 'Fluent Filled', note: 'Microsoft: cheio, cantos suaves.' },
] as const

export type IconStyle = (typeof ICON_STYLES)[number]['id']

type Pair = {
  phosphor: PhosphorIcon
  fluent: ComponentType<{ className?: string }>
  note?: string
}

/** Equivalente de cada ícone escolhido em Phosphor e Fluent (o mais próximo quando não há o mesmo desenho). */
const PAIRS: Record<GroupId, Pair> = {
  dance: { phosphor: FootprintsIcon, fluent: PersonWalking24Filled, note: 'Fluent não tem pegadas: pessoa caminhando.' },
  explore: { phosphor: CompassIcon, fluent: CompassNorthwest24Filled },
  community: { phosphor: UsersThreeIcon, fluent: PeopleCommunity24Filled },
  about: { phosphor: InfoIcon, fluent: Info24Filled },
  filter: { phosphor: FunnelIcon, fluent: Filter24Filled },
  clearFilter: { phosphor: FunnelXIcon, fluent: FilterDismiss24Filled },
  datePicker: { phosphor: CalendarDotsIcon, fluent: CalendarSearch20Filled, note: 'Phosphor não tem calendário com lupa.' },
  fitMap: { phosphor: FrameCornersIcon, fluent: ScanDash24Filled },
  locate: { phosphor: GpsFixIcon, fluent: MyLocation24Filled },
  place: { phosphor: MapPinIcon, fluent: Location24Filled },
  time: { phosphor: ClockIcon, fluent: Clock24Filled },
  price: { phosphor: TicketIcon, fluent: TicketDiagonal24Filled },
  addCalendar: { phosphor: CalendarPlusIcon, fluent: CalendarAdd24Filled },
  download: { phosphor: DownloadSimpleIcon, fluent: CalendarArrowDown24Filled },
  share: { phosphor: ShareNetworkIcon, fluent: Share24Filled },
  directions: { phosphor: NavigationArrowIcon, fluent: Directions24Filled },
  notify: { phosphor: BellRingingIcon, fluent: AlertOn24Filled, note: 'Sem sino com "+": sino tocando.' },
  openDetails: { phosphor: CaretRightIcon, fluent: ChevronRight24Filled },
}

const weighted = (Icon: PhosphorIcon, weight: IconWeight): IconComponent => {
  const Weighted = (props: { className?: string }) => createElement(Icon, { weight, ...props })
  return Weighted
}

/** Cache por estilo e grupo: o mesmo componente a cada render (o React não remonta o ícone). */
const CACHE = new Map<string, IconComponent>()

/** O ícone do grupo no estilo; `lucide` é o escolhido na página. */
export function styledIcon(style: IconStyle, id: GroupId, lucide: IconComponent): IconComponent {
  if (style === 'lucide') return lucide
  const key = `${style}:${id}`
  const cached = CACHE.get(key)
  if (cached) return cached
  const pair = PAIRS[id]
  const icon = style === 'fluent' ? pair.fluent : weighted(pair.phosphor, style === 'phosphorFill' ? 'fill' : 'duotone')
  CACHE.set(key, icon)
  return icon
}

export const pairNote = (id: GroupId) => PAIRS[id].note
