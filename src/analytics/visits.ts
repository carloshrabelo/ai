import { type IsoDate, todayIso } from '../lib/dates'
import { readJson, writeJson } from '../lib/storage'

// Recorrência de visitas sem identificar ninguém: o aparelho guarda só a primeira e a última data de
// visita e em quantos dias diferentes o site foi aberto. O GoatCounter recebe, uma vez por dia, eventos
// agregados ("visit.return", "visit.count/3-5", "visit.gap/2-7d"): nenhum identificador sai do aparelho.

const STORAGE_KEY = 'lisbon-social-dance:visits'

export type Visits = {
  /** Primeiro dia em que o site foi aberto neste aparelho (Lisboa). */
  first: IsoDate
  /** Último dia contado. */
  last: IsoDate
  /** Em quantos dias diferentes o site foi aberto. */
  days: number
}

const isVisits = (value: unknown): value is Visits => {
  const visits = value as Partial<Visits> | null
  return !!visits && typeof visits.first === 'string' && typeof visits.last === 'string' && typeof visits.days === 'number'
}

const DAY_MS = 24 * 60 * 60_000
const daysBetween = (from: IsoDate, to: IsoDate) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS)

/** Faixa do total de dias com visita (inclui o de hoje). */
function countBucket(days: number): string {
  if (days <= 2) return String(days)
  if (days <= 5) return '3-5'
  if (days <= 10) return '6-10'
  return '11+'
}

/** Faixa do intervalo desde a última visita. */
function gapBucket(gap: number): string {
  if (gap <= 1) return '1d'
  if (gap <= 7) return '2-7d'
  if (gap <= 30) return '8-30d'
  return '30d+'
}

/**
 * Próximo estado e eventos de hoje. Já contado hoje: sem eventos. Primeira vez: "visit.new" e
 * "visit.count/1". Volta: "visit.return", a faixa do total de dias e a do intervalo.
 */
export function countVisitOn(today: IsoDate, previous: Visits | undefined): { next: Visits; events: string[] } {
  if (!previous) return { next: { first: today, last: today, days: 1 }, events: ['visit.new', 'visit.count/1'] }
  if (previous.last >= today) return { next: previous, events: [] }
  const next = { ...previous, last: today, days: previous.days + 1 }
  return {
    next,
    events: ['visit.return', `visit.count/${countBucket(next.days)}`, `visit.gap/${gapBucket(daysBetween(previous.last, today))}`],
  }
}

/** Conta a visita de hoje neste aparelho e devolve os eventos para o analytics (vazio se já contou). */
export function countVisit(today = todayIso()): string[] {
  const previous = readJson<Visits | undefined>(STORAGE_KEY, undefined, isVisits)
  const { next, events } = countVisitOn(today, previous)
  if (events.length > 0) writeJson(STORAGE_KEY, next)
  return events
}
