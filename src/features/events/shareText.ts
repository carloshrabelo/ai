import type { DanceEvent } from '../../domain/event'
import type { Locale } from '../../i18n/locale'
import { agendaToday, lisbonDate } from '../../lib/dates'
import { formatShortDate, formatTime } from './format'
import { eventTiming } from './timing'

/** Pedaços já prontos para usar no texto. */
type Parts = {
  /** Nome do evento. */
  title: string
  /** Quando, com início e fim: "Hoje das 20:30 às 23:00", "Hoje, agora até 23:00", "De 30/07 a 02/08". */
  when: string
  /** Nome do local (vazio quando o evento não tem local: a linha dele some, ver dropEmptyLines). */
  venue: string
  /** Link da página do evento. */
  url: string
}

/**
 * Texto do compartilhamento em cada idioma. Para mudar a mensagem, edite o `text` abaixo: as quebras de linha
 * do texto são as da mensagem, e `*negrito*` vira negrito no WhatsApp. Uma linha que fique só com o emoji
 * (ex.: "📍" de um evento sem local) é removida.
 */
const MESSAGE: Record<Locale, (parts: Parts) => string> = {
  'pt-BR': ({ title, when, venue, url }) => {
    const text = `❤️ A dança é ainda melhor quando partilhada!

*${title}*

📅 ${when}
📍 ${venue}

🎶 Boa música, novas conexões e muitos passos de dança!

👉 Descobre os detalhes:
${url}`
    return text
  },
  'en-US': ({ title, when, venue, url }) => {
    const text = `❤️ Dancing is even better when shared!

*${title}*

📅 ${when}
📍 ${venue}

🎶 Great music, new connections and lots of dance moves!

👉 See the details:
${url}`
    return text
  },
}

/** Palavras usadas para montar o "quando". */
const WORDS: Record<
  Locale,
  {
    today: string
    onDay: (date: string) => string
    /** Evento com horário, na mesma noite: "Hoje das 20:30 às 23:00". */
    between: (day: string, start: string, end: string) => string
    /** Já começou: "Hoje, agora até 23:00". */
    liveUntil: (end: string) => string
    /** Evento com horário que dura mais de um dia (festival): "De 30/07 às 20:00 a 02/08 às 18:00". */
    spanning: (startDate: string, startTime: string, endDate: string, endTime: string) => string
    /** Dia inteiro em vários dias: "De 30/07 a 02/08". */
    onDays: (first: string, last: string) => string
  }
> = {
  'pt-BR': {
    today: 'Hoje',
    onDay: (date) => `Dia ${date}`,
    between: (day, start, end) => `${day} das ${start} às ${end}`,
    liveUntil: (end) => `Hoje, agora até ${end}`,
    spanning: (startDate, startTime, endDate, endTime) => `De ${startDate} às ${startTime} a ${endDate} às ${endTime}`,
    onDays: (first, last) => `De ${first} a ${last}`,
  },
  'en-US': {
    today: 'Today',
    onDay: (date) => `On ${date}`,
    between: (day, start, end) => `${day} from ${start} to ${end}`,
    liveUntil: (end) => `Today, right now until ${end}`,
    spanning: (startDate, startTime, endDate, endTime) => `From ${startDate} at ${startTime} to ${endDate} at ${endTime}`,
    onDays: (first, last) => `From ${first} to ${last}`,
  },
}

/**
 * Texto do compartilhamento (ver MESSAGE acima). Quando: dia ("Hoje" ou "Dia 28/11") com início e fim, "agora
 * até…" se já começou. Sem local, a linha do local some.
 */
export function shareText(event: DanceEvent, url: string, locale: Locale, now = new Date()): string {
  return dropEmptyLines(MESSAGE[locale]({ title: event.title, when: shareWhen(event, locale, now), venue: event.venue?.name ?? '', url }))
}

/** Tira as linhas que ficaram só com um emoji, porque o valor delas veio vazio ("📍 " de um evento sem local). */
function dropEmptyLines(text: string): string {
  return text
    .split('\n')
    .filter((line) => !/^\p{Extended_Pictographic}\uFE0F?\s*$/u.test(line))
    .join('\n')
}

/** Um evento com horário que termina até 24h depois do início é "da mesma noite" (ex.: 22:00 às 03:00). */
const ONE_NIGHT_MS = 24 * 60 * 60_000

function shareWhen(event: DanceEvent, locale: Locale, now: Date): string {
  const words = WORDS[locale]
  const time = (date: Date) => formatTime(date, locale)
  const date = (date: Date) => formatShortDate(lisbonDate(date), locale)

  if (!event.allDay) {
    if (eventTiming(event, now.getTime()) === 'live') return words.liveUntil(time(event.end))
    if (event.end.getTime() - event.start.getTime() > ONE_NIGHT_MS)
      return words.spanning(date(event.start), time(event.start), date(event.end), time(event.end))
    // "Hoje" segue o dia da agenda (até as 05:00 ainda é a noite anterior).
    const day = lisbonDate(event.start) === agendaToday(now) ? words.today : words.onDay(date(event.start))
    return words.between(day, time(event.start), time(event.end))
  }

  // Dia inteiro: um dia só ("Hoje", "Dia 30/07") ou vários ("De 30/07 a 02/08").
  const startDay = lisbonDate(event.start)
  const lastDay = lisbonDate(new Date(event.end.getTime() - 1)) // fim exclusivo
  if (lastDay !== startDay) return words.onDays(formatShortDate(startDay, locale), formatShortDate(lastDay, locale))
  return startDay === agendaToday(now) ? words.today : words.onDay(formatShortDate(startDay, locale))
}
