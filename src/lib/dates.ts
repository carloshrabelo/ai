import { TIME_ZONE } from '../api/config'

/** Data de calendário no formato YYYY-MM-DD, sem hora nem fuso. */
export type IsoDate = string

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDate(value: string | null | undefined): value is IsoDate {
  return !!value && ISO_DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

const ISO_IN_LISBON = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }) // en-CA = YYYY-MM-DD

/** Data de calendário de um instante, no fuso de Lisboa. */
export function lisbonDate(at: Date): IsoDate {
  return ISO_IN_LISBON.format(at)
}

/** Hoje no fuso de Lisboa. */
export function todayIso(now = new Date()): IsoDate {
  return lisbonDate(now)
}

/** Hora (de Lisboa) em que a agenda passa para o dia seguinte. */
export const AGENDA_DAY_START_HOUR = 5

/**
 * "Hoje" da agenda: o dia de calendário até as 05:00 do dia seguinte, em Lisboa. Quem abre o app à 1h da manhã
 * ainda está na noite anterior (festas que vão até as 3h, 4h): a agenda abre nesse dia, e ele aparece como "Hoje".
 */
export function agendaToday(now = new Date()): IsoDate {
  return lisbonDate(new Date(now.getTime() - AGENDA_DAY_START_HOUR * 60 * 60_000))
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Diferença, em minutos, entre o horário de Lisboa e UTC num dado instante. */
function lisbonOffsetMinutes(at: Date): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, timeZoneName: 'longOffset' })
    .formatToParts(at)
    .find((p) => p.type === 'timeZoneName')?.value // "GMT", "GMT+01:00"
  const match = name?.match(/GMT([+-])(\d{2}):(\d{2})/)
  if (!match) return 0
  const minutes = Number(match[2]) * 60 + Number(match[3])
  return match[1] === '-' ? -minutes : minutes
}

/** Instante da meia-noite dessa data em Lisboa. */
export function lisbonMidnight(date: IsoDate): Date {
  const utcMidnight = new Date(`${date}T00:00:00Z`)
  return new Date(utcMidnight.getTime() - lisbonOffsetMinutes(utcMidnight) * 60_000)
}
