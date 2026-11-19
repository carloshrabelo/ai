import { CALENDARS } from '../domain/calendarSources'
import type { Genre } from '../domain/genres'

// Conteúdo da página Comunidade (/community), espelho de https://pasdedeux.pt/outros.html:
// outros calendários, grupos de WhatsApp, perfis do Instagram e os calendários do Pas de Deux para
// assinar no app de agenda ou abrir no Google Agenda. Nomes são nomes próprios (sem tradução).

/** `genre`: cor e bandeira do estilo (a mesma paleta das tags dos eventos). */
export type CommunityLink = { name: string; url: string; detail?: string; genre?: Genre }

/** Agendas de outras comunidades. */
export const OTHER_CALENDARS: CommunityLink[] = [
  { name: 'Latinas', url: 'https://salsalisbon.com/', detail: 'salsalisbon.com', genre: 'Latinas' },
  { name: 'West Coast Swing', url: 'http://tinyurl.com/wcsportugalschedule', detail: 'WCS Portugal', genre: 'West Coast Swing' },
  { name: 'Dancing Events', url: 'https://chat.whatsapp.com/GChrQA4ENBW2MLH25rBTnv', detail: 'WhatsApp' },
  {
    name: 'Tradicionais',
    url: 'https://calendar.google.com/calendar/u/0/embed?src=europeias.agenda@gmail.com&ctz=Europe/Lisbon&mode=agenda',
    detail: 'europeias.agenda@gmail.com',
    genre: 'Tradicionais',
  },
  { name: 'Tango', url: 'https://www.tangolx.com/', detail: 'tangolx.com', genre: 'Tango' },
]

/** Grupos de WhatsApp por estilo. */
export const WHATSAPP_GROUPS: CommunityLink[] = [
  { name: 'Forró', url: 'https://chat.whatsapp.com/EloroWmR46tLNZWXVFTUu9', genre: 'Forró' },
  { name: 'Salsa', url: 'https://chat.whatsapp.com/JfoGrlHvfrD6rDfjQ2NRYY', genre: 'Salsa' },
  { name: 'West Coast Swing', url: 'https://chat.whatsapp.com/Eu5lhl1EtXE2heNtKJ7Q2I', genre: 'West Coast Swing' },
  { name: 'Bachata Sensual', url: 'https://chat.whatsapp.com/KpTURq9uay8D76XUV22zbc', genre: 'Bachata' },
  { name: 'Zouk', url: 'https://chat.whatsapp.com/IjpLXYSgEhk1oefhZ0A2vL', genre: 'Zouk' },
  { name: 'Kizomba', url: 'https://chat.whatsapp.com/HH7Z4ZC4tRHJ0xWXjh9fK2', genre: 'Kizomba' },
]

export const INSTAGRAM: CommunityLink[] = [
  { name: 'Pas de Deux', url: 'https://www.instagram.com/pasdedeux.pt/', detail: '@pasdedeux.pt' },
  { name: 'Samba de Gafieira', url: 'https://www.instagram.com/sambadegafieiralisboa/', detail: '@sambadegafieiralisboa' },
]

/** Calendários do Pas de Deux: id do Google Agenda (assinar .ics e abrir no Google). */
export const PASDEDEUX_CALENDARS: { name: string; id: string }[] = [
  { name: 'Pas de Deux', id: CALENDARS.pasdedeux.calendarId },
  { name: 'Pas de Deux Vintage', id: 'j67f6ur08g3np778li9t2ptf3g@group.calendar.google.com' },
  { name: 'Pas de Deux Brasileiras', id: 'omasrune89s6kj82at515p4mbc@group.calendar.google.com' },
  { name: 'Pas de Deux Afro-Latinas', id: '3dg3m7hn4dk3s85u2qusuarj3c@group.calendar.google.com' },
]

/** Link .ics público (assinatura em qualquer app de agenda). */
export const icsUrl = (id: string) => `https://calendar.google.com/calendar/ical/${encodeURIComponent(id)}/public/basic.ics`

/** webcal:// abre direto o app de agenda do iPhone e do Mac para assinar. */
export const webcalUrl = (id: string) => icsUrl(id).replace(/^https:/, 'webcal:')

/** O calendário no Google Agenda (modo lista). */
export const googleCalendarUrl = (id: string) =>
  `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(id)}&ctz=Europe%2FLisbon&mode=agenda`
