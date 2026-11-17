import { type IsoDate, isIsoDate, lisbonDate } from '../data/dates'

/** "Festa Mirage — 5€!" → "festa-mirage-5" (minúsculas, sem acento, só letras, números e "-"). */
export function slugify(text: string, maxLength = 60): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/, '')
}

/** Hash curto e estável (FNV-1a, base 36) para desempatar eventos com mesmo nome no mesmo dia. */
function shortHash(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36).slice(0, 5)
}

/**
 * Parte da URL de um evento: dia (Lisboa) + nome + hash do id do calendário.
 * Ex.: "2026-11-17-samba-no-mercado-1x9kq". O mesmo evento gera sempre o mesmo slug.
 */
export function eventSlug(event: { id: string; title: string; start: Date }): string {
  const name = slugify(event.title) || 'evento'
  return `${lisbonDate(event.start)}-${name}-${shortHash(event.id)}`
}

/** Dia do evento lido do slug ("2026-11-17-…" → "2026-11-17"), ou undefined. */
export function slugDate(slug: string): IsoDate | undefined {
  const day = slug.slice(0, 10)
  return isIsoDate(day) ? day : undefined
}
