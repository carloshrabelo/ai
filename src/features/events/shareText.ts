import type { DanceEvent } from '../../domain/event'
import type { Locale } from '../../i18n/locale'
import { lisbonDate } from '../../lib/dates'
import { formatShortDate, formatTime } from './format'
import { eventTiming } from './timing'

/** Pedaços já prontos para usar no texto. */
type Parts = {
  /** Nome do evento. */
  title: string
  /** Quando: "Hoje às 20:30", "Dia 28/11 às 21:00", "Hoje, agora", "De 30/07 a 02/08". */
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

/** Palavras usadas para montar o "quando" e o local. */
const WORDS: Record<
  Locale,
  {
    today: string
    onDay: (date: string) => string
    onDays: (first: string, last: string) => string
    at: (day: string, time: string) => string
    live: string
  }
> = {
  'pt-BR': {
    today: 'Hoje',
    onDay: (date) => `Dia ${date}`,
    onDays: (first, last) => `De ${first} a ${last}`,
    at: (day, time) => `${day} às ${time}`,
    live: 'Hoje, agora',
  },
  'en-US': {
    today: 'Today',
    onDay: (date) => `On ${date}`,
    onDays: (first, last) => `From ${first} to ${last}`,
    at: (day, time) => `${day} at ${time}`,
    live: 'Today, right now',
  },
}

/**
 * Texto do compartilhamento (ver MESSAGE acima). Dia: "Hoje" ou "Dia 28/11"; hora: o início, ou "agora" se já
 * começou. Sem local, a linha do local some.
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

function shareWhen(event: DanceEvent, locale: Locale, now: Date): string {
  const words = WORDS[locale]
  if (eventTiming(event, now.getTime()) === 'live') return words.live

  const startDay = lisbonDate(event.start)
  const day = startDay === lisbonDate(now) ? words.today : words.onDay(formatShortDate(startDay, locale))
  if (!event.allDay) return words.at(day, formatTime(event.start, locale))

  // Dia inteiro: um dia só ("hoje", "dia 30/07") ou vários ("de 30/07 a 02/08").
  const lastDay = lisbonDate(new Date(event.end.getTime() - 1)) // fim exclusivo
  return lastDay === startDay ? day : words.onDays(formatShortDate(startDay, locale), formatShortDate(lastDay, locale))
}
