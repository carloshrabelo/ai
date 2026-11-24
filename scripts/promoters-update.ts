// Atualiza src/content/promoters.json com os perfis do Instagram citados nos eventos, como o
// venues:check faz com os locais. Para cada perfil: papel (promotor = linha "Mais info: @…"; DJ,
// professor, local ou outro pelo contexto), redes sociais, locais, estilos e o último dia em que
// apareceu (sem a lista de eventos). Não apaga ninguém, e o que já está no arquivo (inclusive editado
// à mão: name, role, redes, aliases) fica. Lista no fim os perfis com grafia parecida (erros de
// digitação) para juntar com "aliases". Roda todo dia na Action "Update promoters".
//
// Uso: pnpm promoters:update [dias à frente] [dias para trás]   (padrão: 90 e 30)
// Lê o cache dos eventos (pnpm events:cache; nunca o mock). Cache com mais de 6 horas é gerado de novo
// (VITE_GOOGLE_API_KEY do ambiente ou do .env.local).
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { root, startApp } from './lib/app.ts'
import { loadCachedEvents } from './lib/eventsCache.ts'
import type { DatesModule, ScriptEvent } from './lib/types.ts'

type Entry = { role: string; aliases?: string[] }
type Directory = Record<string, Entry>
type PromoterDirectoryModule = {
  collectPromoters: (events: ScriptEvent[], dayOf: (event: ScriptEvent) => string) => Directory
  mergePromoters: (existing: Directory, found: Directory) => Directory
  similarHandles: (handles: string[]) => [string, string][]
}

const FILE = join(root, 'src/content/promoters.json')
const [daysAfter = 90, daysBefore = 30] = process.argv
  .slice(2)
  .filter((arg) => /^\d+$/.test(arg))
  .map(Number)

const app = await startApp({ name: 'promoters', realData: true })
try {
  const { addDays, lisbonDate, todayIso } = await app.load<DatesModule>('/src/lib/dates.ts')
  const { collectPromoters, mergePromoters, similarHandles } = await app.load<PromoterDirectoryModule>('/src/domain/promoterDirectory.ts')

  const today = todayIso()
  const events = await loadCachedEvents(app, addDays(today, -daysBefore), addDays(today, daysAfter))
  const found = collectPromoters(events, (event) => lisbonDate(event.start))

  const existing = JSON.parse(readFileSync(FILE, 'utf8')) as Directory
  const merged = mergePromoters(existing, found)
  const aliases = new Set(Object.values(merged).flatMap((entry) => entry.aliases ?? []))
  const added = Object.keys(found).filter((handle) => !existing[handle] && !aliases.has(handle))

  writeFileSync(FILE, `${JSON.stringify(merged, null, 2)}\n`)
  console.log(
    `${events.length} eventos (${daysBefore} dias atrás a ${daysAfter} à frente); ${Object.keys(found).length} perfis citados; ` +
      `${added.length} novos; ${Object.keys(merged).length} no arquivo.`,
  )
  for (const handle of added) console.log(`  + @${handle} (${merged[handle].role})`)
  const roles = Object.groupBy(Object.values(merged), (entry) => entry.role)
  console.log(
    `Papéis: ${Object.entries(roles)
      .map(([role, list]) => `${role} ${list?.length ?? 0}`)
      .join(', ')}.`,
  )

  // Grafias parecidas: revisar e, se for o mesmo perfil, acrescentar em `aliases` do perfil certo.
  const suspects = similarHandles(Object.keys(merged))
  if (suspects.length > 0) {
    console.log(`\nPossíveis duplicados (${suspects.length}): se forem o mesmo perfil, use "aliases" no promoters.json.`)
    for (const [a, b] of suspects) console.log(`  @${a} × @${b}`)
  }
} catch (error) {
  console.error(`promoters:update: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  await app.close()
}
