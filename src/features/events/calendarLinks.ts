import type { DanceEvent } from '../../domain/event'

// "Adicionar ao calendário" sem login: o link de modelo do Google Agenda abre a agenda da
// pessoa já preenchida (ela só confirma), e o arquivo .ics funciona no Apple Calendar, no
// Outlook e em qualquer outro calendário. O `htmlLink` do evento original não serve: abre o
// evento dentro do calendário do pasdedeux, em branco para quem não o segue.

/** 20261117T200000Z */
const utcStamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

/** Data de Lisboa sem separadores (dia inteiro): 20261117 */
const lisbonDay = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(date).replace(/-/g, '')

function plainText(html: string | undefined): string {
  return (html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replaceAll('&amp;', '&')
    .replaceAll('&nbsp;', ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function locationText(event: DanceEvent): string {
  return event.venue ? [event.venue.name, event.venue.address].filter(Boolean).join(', ') : ''
}

/** Descrição: link para a página do evento no app + a descrição original (limitada). */
function details(event: DanceEvent, pageUrl: string, maxLength: number): string {
  const description = plainText(event.description)
  const text = description.length > maxLength ? `${description.slice(0, maxLength).trimEnd()}…` : description
  return [pageUrl, text].filter(Boolean).join('\n\n')
}

/** Link de modelo do Google Agenda (abre a agenda da pessoa com o evento preenchido). */
export function googleCalendarUrl(event: DanceEvent, pageUrl: string): string {
  const dates = event.allDay
    ? `${lisbonDay(event.start)}/${lisbonDay(event.end)}` // fim exclusivo, como no Google
    : `${utcStamp(event.start)}/${utcStamp(event.end)}`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates,
    ctz: 'Europe/Lisbon',
    // URL inteira precisa caber (~2000 caracteres): descrição curta.
    details: details(event, pageUrl, 800),
    ...(event.venue ? { location: locationText(event) } : {}),
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

// --- iCalendar (.ics, RFC 5545) ---

/** Escapa texto do iCalendar: \ ; , e quebras de linha. */
const icsEscape = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** Quebra linhas longas (75 octetos), continuando com um espaço, como pede a RFC 5545. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const parts: string[] = []
  let current = ''
  let size = 0
  for (const char of line) {
    const charSize = new TextEncoder().encode(char).length
    if (size + charSize > (parts.length === 0 ? 75 : 74)) {
      parts.push(current)
      current = ''
      size = 0
    }
    current += char
    size += charSize
  }
  parts.push(current)
  return parts.join('\r\n ')
}

/** Conteúdo .ics de um evento. `now` só existe para os testes. */
export function icsContent(event: DanceEvent, pageUrl: string, now = new Date()): string {
  const when = event.allDay
    ? [`DTSTART;VALUE=DATE:${lisbonDay(event.start)}`, `DTEND;VALUE=DATE:${lisbonDay(event.end)}`]
    : [`DTSTART:${utcStamp(event.start)}`, `DTEND:${utcStamp(event.end)}`]
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lisbon Social Dance//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@lisbon-social-dance`,
    `DTSTAMP:${utcStamp(now)}`,
    ...when,
    `SUMMARY:${icsEscape(event.title)}`,
    ...(event.venue ? [`LOCATION:${icsEscape(locationText(event))}`] : []),
    ...(event.venue?.lat !== undefined && event.venue.lng !== undefined ? [`GEO:${event.venue.lat};${event.venue.lng}`] : []),
    `DESCRIPTION:${icsEscape(details(event, pageUrl, 4000))}`,
    `URL:${pageUrl}`,
    ...(event.status === 'cancelled' ? ['STATUS:CANCELLED'] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `${lines.map(fold).join('\r\n')}\r\n`
}

/** Baixa o .ics (no iPhone, o Safari oferece adicionar ao Calendário). */
export function downloadIcs(event: DanceEvent, pageUrl: string, fileName: string) {
  const blob = new Blob([icsContent(event, pageUrl)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.ics`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
