import { addDays, type IsoDate, lisbonDate, lisbonMidnight } from './dates'
import type { GCalDateTime, GCalEvent } from './googleCalendar'

const DAY_MS = 86_400_000
/** Mínimo de dias com eventos na semana passada e na próxima. */
const MIN_DAYS_AROUND = 3

/**
 * Desloca as datas do mock para perto de hoje (Date.now), mantendo o horário de Lisboa.
 * Escolhe um dia do arquivo com eventos e com pelo menos 3 dias de eventos na semana anterior
 * e 3 na seguinte, e faz esse dia cair em hoje. Assim sempre há eventos na semana passada,
 * hoje e na próxima semana.
 * Se existir um dia assim com o mesmo dia da semana de hoje, ele é usado e os eventos semanais
 * ("Segundas SBK") continuam no dia certo. Senão, uma semana cheia vale mais que o dia da semana.
 */
export function shiftMockEvents(items: GCalEvent[], today: IsoDate): GCalEvent[] {
  const anchor = pickAnchorDay(items, today)
  if (!anchor) return items

  const shift = daysBetween(anchor, today)
  return items.map((item) => ({
    ...item,
    start: shiftDateTime(item.start, shift),
    end: shiftDateTime(item.end, shift),
  }))
}

function pickAnchorDay(items: GCalEvent[], today: IsoDate): IsoDate | undefined {
  const days = [...new Set(items.map((item) => dayOf(item.start)))].sort()
  const count = (from: IsoDate, to: IsoDate) => days.filter((day) => day >= from && day <= to).length
  const before = (day: IsoDate) => count(addDays(day, -7), addDays(day, -1))
  const after = (day: IsoDate) => count(addDays(day, 1), addDays(day, 7))

  // Dias com pelo menos 3 dias de eventos na semana anterior e 3 na seguinte,
  // do mais cheio para o mais vazio.
  const candidates = days
    .filter((day) => before(day) >= MIN_DAYS_AROUND && after(day) >= MIN_DAYS_AROUND)
    .map((day) => ({ day, score: before(day) + after(day) }))
    .sort((a, b) => b.score - a.score || a.day.localeCompare(b.day))

  // Mesmo dia da semana de hoje quando existir; senão, a semana cheia vale mais que o dia da semana.
  const sameWeekday = candidates.find(({ day }) => weekday(day) === weekday(today))
  return (sameWeekday ?? candidates[0])?.day ?? days[0]
}

function dayOf(value: GCalDateTime): IsoDate {
  if (value.date) return value.date
  return lisbonDate(new Date(value.dateTime ?? 0))
}

function weekday(day: IsoDate): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay()
}

function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((lisbonMidnight(to).getTime() - lisbonMidnight(from).getTime()) / DAY_MS)
}

/** Soma dias mantendo o horário de parede em Lisboa (mesmo atravessando a mudança de horário). */
function shiftDateTime(value: GCalDateTime, days: number): GCalDateTime {
  if (value.date) return { ...value, date: addDays(value.date, days) }
  if (!value.dateTime) return value

  const original = new Date(value.dateTime)
  const day = lisbonDate(original)
  const sinceMidnight = original.getTime() - lisbonMidnight(day).getTime()
  const shifted = new Date(lisbonMidnight(addDays(day, days)).getTime() + sinceMidnight)
  return { ...value, dateTime: shifted.toISOString() }
}
