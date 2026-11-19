import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Chip'
import { genreColorClasses } from '../../components/ui/genreColors'
import promoters from '../../data/promoters.json'
import { type Genre, GENRES } from '../../domain/genres'
import type { PromoterDirectory, PromoterEntry } from '../../domain/promoterDirectory'
import { type Role, ROLES } from '../../domain/promoters'
import { siteUrl, useDocumentHead } from '../../seo/useDocumentHead'
import { BackToTest } from './shared'

const DIRECTORY = Object.entries(promoters as unknown as PromoterDirectory)

/** Grupos na ordem da página; papéis novos em ROLES entram no fim com o próprio nome. */
const GROUP_TITLE: Partial<Record<Role, string>> = {
  promoter: 'Promotores',
  teacher: 'Professores',
  dj: 'DJs',
  venue: 'Locais',
  other: 'Outros',
}
const ORDER: Role[] = [...(['promoter', 'teacher', 'dj', 'venue', 'other'] as Role[]), ...ROLES].filter(
  (role, index, all) => all.indexOf(role) === index,
)

const isGenre = (value: string): value is Genre => (GENRES as readonly string[]).includes(value)

/** "promoters/x.webp" (em public/) ou URL completa. */
const photoUrl = (photo: string) => (/^https?:\/\//.test(photo) ? photo : `${import.meta.env.BASE_URL}${photo}`)

/** Duas letras do nome, ou do @ ("dale.eventss" → "DE"). */
function initials(handle: string, name?: string): string {
  const words = (name ?? handle).split(/[\s._-]+/).filter((word) => /\p{L}/u.test(word))
  return (
    words
      .slice(0, 2)
      .map((word) => word.match(/\p{L}/u)?.[0] ?? '')
      .join('') || handle.slice(0, 2)
  ).toUpperCase()
}

/**
 * Página de teste (/teste/envolvidos, pública mas sem link no app): todo mundo de
 * src/data/promoters.json separado por papel (promotores, professores, DJs, locais, outros), com a
 * foto (campo `photo`, à mão) ou as iniciais, e o @ com link para o Instagram.
 */
export default function People() {
  useDocumentHead({
    title: 'Envolvidos (teste)',
    description: 'Promotores, professores e DJs',
    canonical: `${siteUrl()}teste/envolvidos`,
    noindex: true,
  })
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()

  const visible = DIRECTORY.filter(
    ([handle, entry]) => !term || [handle, entry.name, ...(entry.aliases ?? [])].some((text) => text?.toLowerCase().includes(term)),
  )
  const groups = ORDER.map((role) => ({
    role,
    people: visible
      .filter(([, entry]) => entry.role === role)
      .sort(([a, x], [b, y]) => y.lastSeen.localeCompare(x.lastSeen) || a.localeCompare(b)),
  })).filter(({ people }) => people.length > 0)
  const withPhoto = DIRECTORY.filter(([, entry]) => entry.photo).length

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <BackToTest />
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Envolvidos</h2>
        <p className="text-sm text-fg-muted">
          Perfis citados nos eventos (src/data/promoters.json), separados por papel, dos mais recentes para os mais antigos.{' '}
          {DIRECTORY.length} perfis, {withPhoto} com foto. Foto: campo <code className="rounded bg-surface-muted px-1">photo</code> do
          perfil, com um caminho em <code className="rounded bg-surface-muted px-1">public/</code> (ex.: promoters/perfil.webp) ou uma URL.
        </p>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar @ ou nome"
          aria-label="Buscar @ ou nome"
          className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
        />
        <nav aria-label="Grupos" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {groups.map(({ role, people }) => (
            <a key={role} href={`#grupo-${role}`} className="font-medium text-brand hover:underline">
              {GROUP_TITLE[role] ?? role} ({people.length})
            </a>
          ))}
        </nav>
      </Card>

      {groups.map(({ role, people }) => (
        <section key={role} id={`grupo-${role}`} aria-labelledby={`grupo-${role}-title`} className="scroll-mt-20 space-y-2">
          <h3 id={`grupo-${role}-title`} className="text-lg font-semibold">
            {GROUP_TITLE[role] ?? role} <span className="text-sm font-normal text-fg-muted">({people.length})</span>
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map(([handle, entry]) => (
              <li key={handle}>
                <PersonCard handle={handle} entry={entry} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  )
}

function PersonCard({ handle, entry }: { handle: string; entry: PromoterEntry }) {
  const instagram = entry.socials.instagram ?? `https://www.instagram.com/${handle}/`
  const genres = entry.genres.filter(isGenre).slice(0, 3)
  return (
    <Card className="flex h-full items-start gap-3">
      <Avatar handle={handle} entry={entry} />
      <div className="min-w-0 flex-1 space-y-1">
        <a href={instagram} target="_blank" rel="noreferrer" className="block truncate font-semibold text-brand hover:underline">
          @{handle}
        </a>
        {entry.name && <p className="truncate text-sm">{entry.name}</p>}
        {entry.venues[0] && <p className="truncate text-xs text-fg-muted">{entry.venues.slice(0, 2).join(' · ')}</p>}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {genres.map((genre) => (
              <Chip key={genre} genre={genre} />
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

/** Foto do perfil; sem foto (ou se não carregar), as iniciais na cor do estilo principal. */
function Avatar({ handle, entry }: { handle: string; entry: PromoterEntry }) {
  const [failed, setFailed] = useState(false)
  const genre = entry.genres.find(isGenre)
  if (entry.photo && !failed) {
    return (
      <img
        src={photoUrl(entry.photo)}
        alt=""
        width={56}
        height={56}
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-14 shrink-0 rounded-full border border-border object-cover"
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex size-14 shrink-0 items-center justify-center rounded-full text-base font-semibold ${
        genre ? genreColorClasses(genre) : 'bg-surface-muted text-fg-muted'
      }`}
    >
      {initials(handle, entry.name)}
    </span>
  )
}
