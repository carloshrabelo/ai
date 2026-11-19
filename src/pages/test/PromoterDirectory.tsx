import { useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Chip'
import { Segmented } from '../../components/ui/Segmented'
import promoters from '../../data/promoters.json'
import { type Genre, GENRES } from '../../domain/genres'
import { type PromoterDirectory as Directory, similarHandles, SOCIAL_KINDS, type SocialKind } from '../../domain/promoterDirectory'
import { type Role, ROLES } from '../../domain/promoters'
import { siteUrl, useDocumentHead } from '../../seo/useDocumentHead'
import { ROLE_LABEL, type RoleFilter } from './roleLabels'
import { RoleSelect, RoleTag } from './roles'
import { BackToTest } from './shared'

const DIRECTORY = promoters as unknown as Directory

const SOCIAL_LABEL: Record<SocialKind, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linktree: 'Linktree',
  whatsapp: 'WhatsApp',
  website: 'Site',
}

type Sort = 'lastSeen' | 'handle'

const TH = 'px-4 py-2 font-medium'
const TD = 'px-4 py-2 align-top'

const isGenre = (value: string): value is Genre => (GENRES as readonly string[]).includes(value)

/**
 * Página de teste (/teste/diretorio-promotores, pública mas sem link no app): o conteúdo de
 * src/data/promoters.json, atualizado todo dia pela Action "Update promoters"
 * (scripts/promoters-update.mjs): papel (promotor, DJ, professor, local, outro), redes sociais, locais
 * e estilos de cada perfil, e os perfis que parecem o mesmo escrito de outro jeito.
 */
export default function PromoterDirectory() {
  useDocumentHead({
    title: 'Diretório de promotores (teste)',
    description: 'Promotores com redes, locais e estilos',
    canonical: `${siteUrl()}teste/diretorio-promotores`,
    noindex: true,
  })
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState<Sort>('lastSeen')
  const [role, setRole] = useState<RoleFilter>('promoter')

  const entries = useMemo(() => Object.entries(DIRECTORY), [])
  const genres = useMemo(
    () => [...new Set(entries.flatMap(([, entry]) => entry.genres))].sort((a, b) => a.localeCompare(b, 'pt')),
    [entries],
  )
  const socialCounts = SOCIAL_KINDS.map((kind) => [kind, entries.filter(([, entry]) => entry.socials[kind]).length] as const).filter(
    ([, count]) => count > 0,
  )

  const roleCounts = Object.fromEntries(ROLES.map((r) => [r, entries.filter(([, entry]) => entry.role === r).length])) as Record<
    Role,
    number
  >
  const duplicates = useMemo(() => similarHandles(entries.map(([handle]) => handle)), [entries])

  const term = search.trim().toLowerCase()
  const visible = entries
    .filter(([, entry]) => role === 'all' || entry.role === role)
    .filter(([, entry]) => !genre || entry.genres.includes(genre))
    .filter(
      ([handle, entry]) =>
        !term || [handle, entry.name, ...(entry.aliases ?? []), ...entry.venues].some((text) => text?.toLowerCase().includes(term)),
    )
    .sort(([a, x], [b, y]) => (sort === 'lastSeen' ? y.lastSeen.localeCompare(x.lastSeen) || a.localeCompare(b) : a.localeCompare(b)))

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <BackToTest />
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Diretório de promotores</h2>
        <p className="text-sm text-fg-muted">
          <code className="rounded bg-surface-muted px-1">src/data/promoters.json</code>, atualizado todo dia pela Action{' '}
          <em>Update promoters</em> (ou <code className="rounded bg-surface-muted px-1">pnpm promoters:update</code>). Nome e redes podem
          ser editados à mão (<code className="rounded bg-surface-muted px-1">name</code>,{' '}
          <code className="rounded bg-surface-muted px-1">role</code>, redes, <code className="rounded bg-surface-muted px-1">aliases</code>
          ): o script não apaga nem sobrescreve.
        </p>
        <p className="text-sm text-fg-muted">
          {entries.length} perfis · {ROLES.map((r) => `${roleCounts[r]} ${ROLE_LABEL[r].toLowerCase()}`).join(' · ')} ·{' '}
          {socialCounts.map(([kind, count]) => `${count} com ${SOCIAL_LABEL[kind]}`).join(' · ')}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar perfil, nome ou local"
            aria-label="Buscar perfil, nome ou local"
            className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm"
          />
          <RoleSelect value={role} onChange={setRole} counts={roleCounts} />
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            aria-label="Estilo"
            className="h-11 rounded-lg border border-border bg-surface px-3 text-sm"
          >
            <option value="">Todos os estilos</option>
            {genres.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <Segmented
            label="Ordenar por"
            options={[
              { value: 'lastSeen', label: 'Recentes' },
              { value: 'handle', label: 'A–Z' },
            ]}
            value={sort}
            onChange={setSort}
          />
        </div>
      </Card>

      {duplicates.length > 0 && (
        <Card className="space-y-2">
          <h3 className="font-semibold">Possíveis duplicados ({duplicates.length})</h3>
          <p className="text-sm text-fg-muted">
            Perfis quase iguais, provavelmente erro de digitação no calendário. Se forem o mesmo, acrescente a grafia errada em{' '}
            <code className="rounded bg-surface-muted px-1">aliases</code> do perfil certo em promoters.json: no próximo{' '}
            <code className="rounded bg-surface-muted px-1">pnpm promoters:update</code> as duas entradas viram uma.
          </p>
          <ul className="space-y-1 text-sm">
            {duplicates.map(([a, b]) => (
              <li key={`${a}|${b}`} className="flex flex-wrap items-center gap-x-2">
                <DuplicateHandle handle={a} directory={DIRECTORY} />
                <span className="text-fg-muted">×</span>
                <DuplicateHandle handle={b} directory={DIRECTORY} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {visible.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-fg-muted">
              <tr>
                <th scope="col" className={TH}>
                  Promotor
                </th>
                <th scope="col" className={TH}>
                  Redes
                </th>
                <th scope="col" className={TH}>
                  Locais
                </th>
                <th scope="col" className={TH}>
                  Estilos
                </th>
                <th scope="col" className={TH}>
                  Último evento
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map(([handle, entry]) => (
                <tr key={handle} className="border-b border-border last:border-0">
                  <td className={`${TD} font-medium`}>
                    {entry.name ?? `@${handle}`} {role === 'all' && <RoleTag role={entry.role} />}
                    {entry.name && <span className="block text-xs font-normal text-fg-muted">@{handle}</span>}
                    {entry.aliases && (
                      <span className="block text-xs font-normal text-fg-muted">
                        também: {entry.aliases.map((alias) => `@${alias}`).join(', ')}
                      </span>
                    )}
                  </td>
                  <td className={TD}>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {SOCIAL_KINDS.filter((kind) => entry.socials[kind]).map((kind) => (
                        <a
                          key={kind}
                          href={entry.socials[kind]}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-brand hover:underline"
                        >
                          {SOCIAL_LABEL[kind]}
                        </a>
                      ))}
                    </div>
                  </td>
                  <td className={`${TD} text-fg-muted`}>{entry.venues.join(' · ') || '—'}</td>
                  <td className={TD}>
                    <div className="flex flex-wrap gap-1">
                      {entry.genres.map((value) =>
                        isGenre(value) ? <Chip key={value} genre={value} /> : <span key={value}>{value}</span>,
                      )}
                    </div>
                  </td>
                  <td className={`${TD} whitespace-nowrap tabular-nums`}>{entry.lastSeen.split('-').reverse().join('/')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  )
}

/** Um lado do par de duplicados: perfil (link), papel e local principal. */
function DuplicateHandle({ handle, directory }: { handle: string; directory: Directory }) {
  const entry = directory[handle]
  return (
    <span className="inline-flex items-center gap-1">
      <a href={entry.socials.instagram} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
        @{handle}
      </a>
      <RoleTag role={entry.role} />
      <span className="text-xs text-fg-muted">{entry.venues[0] ?? ''}</span>
    </span>
  )
}
