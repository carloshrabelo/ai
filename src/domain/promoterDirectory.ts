import { levenshtein } from '../lib/text'
import type { DanceEvent } from './event'
import { visibleGenres } from './genres'
import { extractPromoters, type Role, ROLES } from './promoters'

// Diretório de perfis (src/data/promoters.json), montado a partir dos eventos por
// scripts/promoters-update.mjs, como o venues.json. Uma entrada por perfil do Instagram, com o papel
// (promotor, DJ, professor, local, outro), redes sociais, locais e estilos (sem a lista de eventos).
// Edição à mão: `name`, `role`, redes e `aliases` (grafias erradas do mesmo perfil, que passam a
// contar como ele) ficam como estão; o script só acrescenta.

export const SOCIAL_KINDS = ['instagram', 'facebook', 'tiktok', 'youtube', 'linktree', 'whatsapp', 'website'] as const
export type SocialKind = (typeof SOCIAL_KINDS)[number]

export type PromoterEntry = {
  /** Nome para exibição, preenchido à mão (o script não mexe). */
  name?: string
  /**
   * Foto do perfil, preenchida à mão: caminho em public/ ("promoters/perfil.jpg") ou URL. Sem foto,
   * as telas mostram as iniciais. O `promoters:update` não mexe.
   */
  photo?: string
  /** Papel deduzido na primeira vez (ver `roleOf`); corrigível à mão, o script não muda depois. */
  role: Role
  /** Grafias erradas deste perfil vistas no calendário ("dale.eventss"), preenchidas à mão. */
  aliases?: string[]
  socials: Partial<Record<SocialKind, string>>
  /** Locais onde o promotor aparece, do mais frequente para o menos. */
  venues: string[]
  /** Estilos dos eventos dele, do mais frequente para o menos. */
  genres: string[]
  /** Último dia (Lisboa) em que apareceu num evento. */
  lastSeen: string
}

export type PromoterDirectory = Record<string, PromoterEntry>

// Plataformas (ingressos, mapas, formulários, encurtadores, transporte): o link não é o site do promotor.
const PLATFORM =
  /(^|\.)(google\.[a-z.]+|goo\.gl|forms\.gle|bit\.ly|tinyurl\.com|eventbrite\.[a-z.]+|fever(up)?\.[a-z.]+|shotgun\.live|ticketline\.pt|blueticket\.pt|thelastseat\.com|luma\.com|lu\.ma|meetu\.ps|meetup\.com|jotform\.com|carris\.pt|whatsapp\.com|fb\.me|youtu\.be|spotify\.com|apple\.com)$/

// Caminhos de redes sociais que não são de um perfil: posts, eventos, compartilhamentos.
const NOT_PROFILE_PATH = /^\/(?:events?|share|sharer|p|reel|reels|watch|shorts|groups|story|photo|posts?|hashtag)(?:\/|$)/i

/** Classifica um link como rede social de um perfil, ou undefined. */
export function socialOf(url: string): { kind: SocialKind; url: string } | undefined {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return undefined
  }
  const host = parsed.hostname.replace(/^(www|m|web|pt-pt|pt-br)\./, '').toLowerCase()
  const path = parsed.pathname.replace(/\/+$/, '')
  const clean = `https://${host}${path}`
  if (host === 'instagram.com') return undefined // vem do @perfil
  if (host === 'chat.whatsapp.com' || host === 'wa.me') return { kind: 'whatsapp', url: clean }
  const social = ['facebook.com', 'fb.com', 'tiktok.com', 'youtube.com', 'linktr.ee'].includes(host)
  if (social) {
    if (NOT_PROFILE_PATH.test(path) || path === '' || path.split('/').length > 2) {
      // youtube.com/channel/<id> e /c/<nome> têm duas partes.
      if (!(host === 'youtube.com' && /^\/(c|channel)\/[^/]+$/.test(path))) return undefined
    }
    if (host === 'facebook.com' || host === 'fb.com') return { kind: 'facebook', url: clean }
    if (host === 'tiktok.com') return path.startsWith('/@') ? { kind: 'tiktok', url: clean } : undefined
    if (host === 'youtube.com') return /^\/(@|c\/|channel\/)/.test(path) ? { kind: 'youtube', url: clean } : undefined
    return { kind: 'linktree', url: clean }
  }
  // Domínio próprio (fora das plataformas): o site do promotor, sem o caminho.
  if (PLATFORM.test(host) || /tickets?|cket/.test(host)) return undefined
  return { kind: 'website', url: `https://${host}` }
}

const byFrequency = (values: string[]) => {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt')).map(([value]) => value)
}

/** Papel de um perfil pelas menções: promotor se alguma vez veio em "Mais info"; senão o mais comum. */
export function mainRole(counts: Map<Role, number>): Role {
  if (counts.get('promoter')) return 'promoter'
  // Empate: na ordem de ROLES (dj, professor, local, outro).
  return [...ROLES].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))[0]
}

type Found = { roles: Map<Role, number>; venues: string[]; genres: string[]; socials: PromoterEntry['socials']; lastSeen: string }

/**
 * Perfis citados nos eventos. As outras redes só contam em eventos com um único promotor
 * (com vários, não dá para saber de quem é o link).
 */
export function collectPromoters(events: DanceEvent[], dayOf: (event: DanceEvent) => string): PromoterDirectory {
  const found = new Map<string, Found>()
  for (const event of events) {
    const { mentions } = extractPromoters(event.description)
    const promoters = mentions.filter((mention) => mention.role === 'promoter')
    for (const { handle, role } of mentions) {
      const entry: Found = found.get(handle) ?? {
        roles: new Map(),
        venues: [],
        genres: [],
        socials: { instagram: `https://www.instagram.com/${handle}/` },
        lastSeen: '',
      }
      entry.roles.set(role, (entry.roles.get(role) ?? 0) + 1)
      if (event.venue) entry.venues.push(event.venue.name)
      entry.genres.push(...visibleGenres(event.genres))
      const day = dayOf(event)
      if (day > entry.lastSeen) entry.lastSeen = day
      if (promoters.length === 1 && promoters[0].handle === handle) {
        for (const link of event.links) {
          const social = socialOf(link)
          if (social && !entry.socials[social.kind]) entry.socials[social.kind] = social.url
        }
      }
      found.set(handle, entry)
    }
  }
  return Object.fromEntries(
    [...found].map(([handle, entry]) => [
      handle,
      {
        role: mainRole(entry.roles),
        socials: entry.socials,
        venues: byFrequency(entry.venues),
        genres: byFrequency(entry.genres),
        lastSeen: entry.lastSeen,
      },
    ]),
  )
}

/** Junta duas entradas do mesmo perfil; `base` (o arquivo) vence nos campos editáveis. */
function combine(base: PromoterEntry, extra: PromoterEntry): PromoterEntry {
  const aliases = [...new Set([...(base.aliases ?? []), ...(extra.aliases ?? [])])]
  return {
    ...(base.name ? { name: base.name } : extra.name ? { name: extra.name } : {}),
    ...(base.photo ? { photo: base.photo } : extra.photo ? { photo: extra.photo } : {}),
    role: base.role,
    ...(aliases.length > 0 ? { aliases } : {}),
    socials: { ...extra.socials, ...base.socials },
    venues: [...new Set([...base.venues, ...extra.venues])],
    genres: [...new Set([...base.genres, ...extra.genres])],
    lastSeen: extra.lastSeen > base.lastSeen ? extra.lastSeen : base.lastSeen,
  }
}

/**
 * Junta o que foi encontrado agora com o arquivo: não apaga ninguém; nome, foto, papel, redes e aliases já
 * gravados (inclusive à mão) ficam; locais e estilos novos entram depois dos já conhecidos; lastSeen
 * avança. Um perfil listado em `aliases` de outro é incorporado a ele (e sai do arquivo).
 */
export function mergePromoters(existing: PromoterDirectory, found: PromoterDirectory): PromoterDirectory {
  const canonical = new Map<string, string>()
  for (const [handle, entry] of Object.entries(existing)) for (const alias of entry.aliases ?? []) canonical.set(alias, handle)
  const resolve = (handle: string) => canonical.get(handle) ?? handle

  const merged: PromoterDirectory = {}
  const add = (handle: string, entry: PromoterEntry) => {
    const key = resolve(handle)
    // A instagram da grafia errada não serve: fica a do perfil certo.
    const fixed = key === handle ? entry : { ...entry, socials: { ...entry.socials, instagram: `https://www.instagram.com/${key}/` } }
    merged[key] = merged[key] ? combine(merged[key], fixed) : fixed
  }
  // Primeiro o arquivo (os perfis certos antes dos aliases), depois o que foi encontrado agora.
  const ordered = Object.entries(existing).sort(([a], [b]) => Number(canonical.has(a)) - Number(canonical.has(b)))
  for (const [handle, entry] of ordered) add(handle, entry)
  for (const [handle, entry] of Object.entries(found)) add(handle, entry)

  // Ordem estável no arquivo (diffs pequenos no git).
  return Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)))
}

/**
 * Perfis que parecem o mesmo escrito de outro jeito: iguais sem "." e "_" (tropicavana.bar /
 * tropicavana_bar) ou com até 2 letras de diferença em nomes longos (dale.events / dale.eventss).
 * Para revisar e, se for o caso, juntar com `aliases`.
 */
export function similarHandles(handles: string[]): [string, string][] {
  const plain = (handle: string) => handle.replace(/[._]/g, '')
  const pairs: [string, string][] = []
  const sorted = [...handles].sort()
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const [a, b] = [sorted[i], sorted[j]]
      const same = plain(a) === plain(b)
      const close = Math.min(a.length, b.length) >= 8 && levenshtein(plain(a), plain(b)) <= 2
      if (same || close) pairs.push([a, b])
    }
  }
  return pairs
}
