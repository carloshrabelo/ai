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
